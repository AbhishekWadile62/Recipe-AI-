from ultralytics import YOLO
import sys

model = YOLO("yolov8n.pt")
results = model(sys.argv[1])  # 'image.jpg'

for r in results:
    print(r.boxes.xyxy.tolist())  # Send bounding boxes back to Node.js
