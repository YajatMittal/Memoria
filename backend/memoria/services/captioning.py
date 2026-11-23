"""Image captioning with Salesforce BLIP.

The model (~1 GB) is loaded lazily on the first upload rather than at import
time, so the API boots instantly and tests never need to download it.
"""

import threading

from flask import current_app
from PIL import Image

_lock = threading.Lock()
_model = None
_processor = None


def _load():
    global _model, _processor
    with _lock:
        if _model is None:
            from transformers import BlipForConditionalGeneration, BlipProcessor

            name = current_app.config["CAPTION_MODEL"]
            current_app.logger.info("Loading captioning model %s ...", name)
            _processor = BlipProcessor.from_pretrained(name)
            _model = BlipForConditionalGeneration.from_pretrained(name)
            _model.eval()
    return _processor, _model


def caption_image(image: Image.Image) -> str:
    """Return a short natural-language description of an RGB image."""
    import torch

    processor, model = _load()
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        output = model.generate(**inputs, max_new_tokens=40)
    caption = processor.decode(output[0], skip_special_tokens=True).strip()
    return caption[:1].upper() + caption[1:] if caption else "A photo"
