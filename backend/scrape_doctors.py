import asyncio
import requests
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient

# Yeh URL aap kisi bhi city/specialty ke mutabiq change karsakte hain
URL = "https://oladoc.com/pakistan/karachi/neurologist"

# Websites bots ko block karti hain, isliye headers zaroori hain taake hum normal browser lagain
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# Aapki MongoDB ka connection (agar URI different hai tou change karlen)
MONGO_URI = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URI)
db = client["neuromed_db"] # Apna database name yahan likhein (jaise config me hai)
collection = db["doctors"] # Naya table/collection

async def scrape_doctors():
    print(f"[*] Scraping data from {URL} ...")
    response = requests.get(URL, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"[!] Error: Website returned status {response.status_code}. (Shayad website ne block kardia hai)")
        return

    # HTML page ko parse kar rahe hain
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # -------------------------------------------------------------------
    # NOTE: Website ka structure time ke sath change hota rehta hai.
    # Aapko Chrome mein "Inspect Element" karke exact class names dekhne hongay.
    # Oladoc normally har doctor ko kisi container div mein rakhti hai,
    # example ke tor par main yahan aik general class name likh raha hon.
    # -------------------------------------------------------------------
    
    # Har doctor ka card/box dhundain (yeh class name aapko inspect karke set karni hogi)
    # Hint: Oladoc me usually "doctor-listing" ya is se milti julti class hoti hai
    doctor_cards = soup.find_all('div', class_='listing-card') # TODO: Inspect on oladoc & update class
    
    if not doctor_cards:
        print("[!] Koi doctor nahi mila. HTML tags ya classes update ho chuki hain. Chrome se Inspect karke theek class daalein.")
        return
        
    extracted_doctors = []
    
    for card in doctor_cards:
        try:
            # Name
            name_elem = card.find('h2') # Ya jo bhi tag ho jis mein naam ho
            name = name_elem.text.strip() if name_elem else "Dr. Unknown"
            
            # Specialty
            spec_elem = card.find('div', class_='specialty')
            specialty = spec_elem.text.strip() if spec_elem else "Neurologist"
            
            # Fee (optional)
            fee_elem = card.find('div', class_='fee')
            fee_text = fee_elem.text.strip() if fee_elem else "1500"
            # Extract number from fee_text (e.g. "Rs. 1,500" -> 1500)
            fee = int(''.join(filter(str.isdigit, fee_text))) if any(c.isdigit() for c in fee_text) else 1500
            
            # Database record banana
            doctor_data = {
                "name": name,
                "specialty": specialty,
                "city": "Karachi",
                "latitude": 24.8607,  # Default Karachi Lat. Bad mein apko places API se exact nikalna parh sakta hai
                "longitude": 67.0011, # Default Karachi Long
                "fee": fee,
                "is_verified": True
            }
            extracted_doctors.append(doctor_data)
            print(f" -> Found: {name}")
            
        except Exception as e:
            print(f"[!] Error reading a doctor's info: {e}")
            
    if extracted_doctors:
        # Data MongoDB mein save karna
        await collection.insert_many(extracted_doctors)
        print(f"\n[+] Success! {len(extracted_doctors)} doctors saved to database!")

if __name__ == "__main__":
    asyncio.run(scrape_doctors())
