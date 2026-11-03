import os
from PIL import Image, ImageDraw, ImageFont

screenshots_dir = 'assets/screenshots'
output_gif = 'assets/certificate-verification-demo.gif'

steps = [
    ('landing.png', 'Step 1/8: Public Portal — Decentralized Academic Verification System'),
    ('institution-dashboard.png', 'Step 2/8: Institution Portal — Template Selection & Student Roster'),
    ('certificate-issuance.png', 'Step 3/8: AI-Assisted OCR Pre-Fill & Certificate Issuance'),
    ('student-dashboard.png', 'Step 4/8: Student Credential Wallet — One-Click PDF Download & QR'),
    ('verification-success.png', 'Step 5/8: Public Verification — Authentic Certificate SHA-256 Match'),
    ('qr-verification.png', 'Step 6/8: Multi-Modal Public Verification — Instant QR Code Lookup'),
    ('tamper-detection.png', 'Step 7/8: Security Test — Instant Tamper Detection (Hash Mismatch)'),
    ('revoked-certificate.png', 'Step 8/8: Lifecycle Governance — On-Chain Certificate Revocation')
]

frames = []
target_size = (960, 600)

for filename, caption in steps:
    filepath = os.path.join(screenshots_dir, filename)
    if not os.path.exists(filepath):
        print(f'Warning: {filepath} not found')
        continue
    
    img = Image.open(filepath).convert('RGB')
    img = img.resize(target_size, Image.Resampling.LANCZOS)
    
    # Overlay an elegant top status pill / banner
    draw = ImageDraw.Draw(img)
    # Top banner bar
    draw.rectangle([(0, 0), (target_size[0], 48)], fill=(11, 15, 25))
    draw.line([(0, 48), (target_size[0], 48)], fill=(56, 189, 248), width=2)
    
    # Draw pill badge
    draw.rounded_rectangle([(16, 10), (160, 38)], radius=6, fill=(30, 41, 59), outline=(99, 102, 241), width=1)
    draw.text((26, 15), 'EMERTECH CERTIFY', fill=(129, 140, 248))
    
    # Draw step caption
    draw.text((180, 15), caption, fill=(241, 245, 249))
    
    # Bottom subtle watermark
    draw.rectangle([(0, target_size[1] - 28), (target_size[0], target_size[1])], fill=(11, 15, 25))
    draw.text((20, target_size[1] - 22), 'AI-Assisted Blockchain-Based Academic Certificate Verification System  •  Saqib Ahmad Bhat', fill=(148, 163, 184))
    
    # Duplicate frame 2 times to control timing smoothly
    # 2.2 seconds per step = 2200ms
    frames.append(img)

# Save animated GIF
if frames:
    frames[0].save(
        output_gif,
        save_all=True,
        append_images=frames[1:],
        duration=2200,
        loop=0,
        optimize=True
    )
    print(f'Successfully generated {output_gif} ({len(frames)} steps, size: {os.path.getsize(output_gif) / (1024*1024):.2f} MB)')
