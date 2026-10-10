import torch
import torchvision.models as models
import torch.nn as nn
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image
import numpy as np

def run_test():
    try:
        model = models.swin_t(weights=None)
        model.head = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(768, 4)
        )
        model.eval()

        # Swin-T has output features of shape [batch, 49, 768] before pooling.
        # But wait, torchvision's swin_t output of features is [batch, 768, 7, 7]
        # Let's check what `model.features(torch.randn(1, 3, 224, 224)).shape` is.
        dummy_input = torch.randn(1, 3, 224, 224)
        features_out = model.features(dummy_input)
        print(f"Features output shape: {features_out.shape}")
        
        target_layers = [model.features[-1][-1].norm2]
        
        # Pytorch-grad-cam's generic GradCAM requires the layer to output [batch, channels, H, W]
        # Torchvision's swin features actually output [batch, 768, 7, 7] if permuted, or [batch, 49, 768] if not.
        
        # We will define a reshape_transform to handle it
        def reshape_transform(tensor, height=7, width=7):
            # Tensor shape is [batch, 49, 768]
            result = tensor.reshape(tensor.size(0), height, width, tensor.size(2))
            # Bring the channels to the first dimension like in CNNs.
            result = result.transpose(2, 3).transpose(1, 2)
            return result

        cam = GradCAM(model=model, target_layers=target_layers, reshape_transform=reshape_transform)
        
        targets = [ClassifierOutputTarget(0)]
        grayscale_cam = cam(input_tensor=dummy_input, targets=targets)
        print(f"Grayscale CAM shape: {grayscale_cam.shape}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
