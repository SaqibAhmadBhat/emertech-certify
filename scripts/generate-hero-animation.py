import os
import math
from PIL import Image, ImageDraw, ImageFont

output_gif = 'assets/emertech-certify-hero.gif'
output_png = 'assets/emertech-certify-hero.png'

WIDTH, HEIGHT = 1200, 520

def create_base_canvas():
    img = Image.new('RGB', (WIDTH, HEIGHT), (11, 15, 25))
    draw = ImageDraw.Draw(img)
    
    # Draw subtle background grid
    grid_color = (20, 27, 45)
    for x in range(0, WIDTH, 40):
        draw.line([(x, 0), (x, HEIGHT)], fill=grid_color, width=1)
    for y in range(0, HEIGHT, 40):
        draw.line([(0, y), (WIDTH, y)], fill=grid_color, width=1)
        
    # Draw soft top glowing accents
    draw.line([(0, 0), (WIDTH, 0)], fill=(56, 189, 248), width=3)
    draw.line([(0, HEIGHT-1), (WIDTH, HEIGHT-1)], fill=(99, 102, 241), width=2)
    return img, draw

frames = []

# ==========================================
# SCENE 1: Academic Certificate Card Enters
# ==========================================
for step in range(4):
    img, draw = create_base_canvas()
    alpha = (step + 1) / 4.0
    
    # Header badge
    draw.rounded_rectangle([(WIDTH//2 - 180, 30), (WIDTH//2 + 180, 65)], radius=18, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
    draw.text((WIDTH//2 - 130, 40), "STEP 1: ACADEMIC CREDENTIAL ISSUANCE", fill=(56, 189, 248))
    
    # Certificate Mockup Card
    cx, cy = WIDTH//2, HEIGHT//2 + 20
    cw, ch = 540, 320
    draw.rounded_rectangle([(cx - cw//2, cy - ch//2), (cx + cw//2, cy + ch//2)], radius=16, fill=(15, 23, 42), outline=(99, 102, 241), width=2)
    # Inner border
    draw.rounded_rectangle([(cx - cw//2 + 12, cy - ch//2 + 12), (cx + cw//2 - 12, cy + ch//2 - 12)], radius=10, fill=(15, 23, 42), outline=(30, 41, 59), width=1)
    
    draw.text((cx - 200, cy - 120), "GOVERNMENT COLLEGE OF ENGINEERING, TIRUNELVELI", fill=(148, 163, 184))
    draw.text((cx - 160, cy - 80), "BACHELOR OF ENGINEERING", fill=(241, 245, 249))
    draw.text((cx - 190, cy - 45), "Computer Science and Engineering", fill=(129, 140, 248))
    
    draw.text((cx - 200, cy + 15), "Conferred upon: Saqib Ahmad Bhat", fill=(255, 255, 255))
    draw.text((cx - 200, cy + 50), "Registration No: 950020104001  •  Class: First Class with Distinction", fill=(148, 163, 184))
    draw.text((cx - 200, cy + 85), "Date of Issue: May 2026  •  Autonomous Institution Accredited by NBA", fill=(100, 116, 139))
    
    # Gold Seal
    draw.ellipse([(cx + cw//2 - 90, cy + ch//2 - 90), (cx + cw//2 - 30, cy + ch//2 - 30)], fill=(245, 158, 11), outline=(251, 191, 36), width=2)
    draw.text((cx + cw//2 - 75, cy + ch//2 - 68), "VERIFIED\n SEAL", fill=(11, 15, 25))
    
    frames.append(img)

# ==========================================
# SCENE 2: SHA-256 Cryptographic Fingerprint
# ==========================================
for step in range(4):
    img, draw = create_base_canvas()
    
    draw.rounded_rectangle([(WIDTH//2 - 180, 30), (WIDTH//2 + 180, 65)], radius=18, fill=(15, 23, 42), outline=(129, 140, 248), width=1)
    draw.text((WIDTH//2 - 145, 40), "STEP 2: CRYPTOGRAPHIC SHA-256 HASH", fill=(129, 140, 248))
    
    # Left: Mini Certificate
    draw.rounded_rectangle([(140, 140), (460, 420)], radius=12, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
    draw.text((160, 170), "DIGITAL PDF CERTIFICATE", fill=(56, 189, 248))
    draw.text((160, 205), "Student: Saqib Ahmad Bhat", fill=(241, 245, 249))
    draw.text((160, 235), "Reg No: 950020104001", fill=(148, 163, 184))
    draw.text((160, 265), "Degree: B.E. Computer Science", fill=(148, 163, 184))
    draw.text((160, 340), "Raw Bytes: 107,052 bytes (Vector PDF)", fill=(100, 116, 139))
    
    # Scanning laser
    scan_y = 150 + (step * 60)
    draw.line([(140, scan_y), (460, scan_y)], fill=(56, 189, 248), width=3)
    
    # Middle: Arrow & Math Function
    draw.line([(490, 280), (670, 280)], fill=(99, 102, 241), width=3)
    draw.polygon([(670, 275), (690, 280), (670, 285)], fill=(99, 102, 241))
    draw.text((510, 250), "SHA-256 Function", fill=(129, 140, 248))
    
    # Right: 32-Byte Hash Output
    draw.rounded_rectangle([(710, 180), (1070, 380)], radius=14, fill=(15, 23, 42), outline=(16, 185, 129), width=2)
    draw.text((735, 210), "IMMUTABLE DOCUMENT HASH (bytes32)", fill=(16, 185, 129))
    draw.text((735, 250), "0x27806045a67e80de57662012c5bc1cf00f50d1cf", fill=(241, 245, 249))
    draw.text((735, 280), "eb5d0944115c28ff43fdcfdc27806045a67e80de57", fill=(241, 245, 249))
    draw.text((735, 330), "• Exact 256-bit mathematical digest", fill=(148, 163, 184))
    draw.text((735, 350), "• Avalanche effect: 1 byte change alters digest", fill=(148, 163, 184))
    
    frames.append(img)

# ==========================================
# SCENE 3: Blockchain Smart Contract Mined
# ==========================================
for step in range(4):
    img, draw = create_base_canvas()
    
    draw.rounded_rectangle([(WIDTH//2 - 180, 30), (WIDTH//2 + 180, 65)], radius=18, fill=(15, 23, 42), outline=(16, 185, 129), width=1)
    draw.text((WIDTH//2 - 155, 40), "STEP 3: DECENTRALIZED SMART CONTRACT", fill=(16, 185, 129))
    
    # Left Block
    draw.rounded_rectangle([(120, 160), (380, 380)], radius=12, fill=(15, 23, 42), outline=(30, 41, 59), width=1)
    draw.text((140, 185), "BLOCK #19609", fill=(148, 163, 184))
    draw.text((140, 220), "Prev: 0x9a8b7c...", fill=(100, 116, 139))
    draw.text((140, 250), "Txs: 12", fill=(100, 116, 139))
    
    # Link
    draw.line([(380, 270), (460, 270)], fill=(99, 102, 241), width=4)
    
    # Active Mined Block
    draw.rounded_rectangle([(460, 140), (760, 400)], radius=14, fill=(15, 23, 42), outline=(16, 185, 129), width=2)
    draw.text((485, 165), "ETHEREUM EVM BLOCK #19610", fill=(16, 185, 129))
    draw.text((485, 195), "Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3", fill=(129, 140, 248))
    draw.line([(485, 220), (735, 220)], fill=(30, 41, 59), width=1)
    draw.text((485, 235), "Event: CertificateIssued", fill=(241, 245, 249))
    draw.text((485, 260), "ID: UN01-CERT-8UES57-2026", fill=(56, 189, 248))
    draw.text((485, 285), "Hash: 0x27806045...43fdcfdc", fill=(241, 245, 249))
    draw.text((485, 310), "Issuer: 0xf39Fd6e51aad88F6F4ce...", fill=(148, 163, 184))
    draw.text((485, 345), "Status: IMMUTABLE ON-CHAIN RECORD", fill=(16, 185, 129))
    
    # Link
    draw.line([(760, 270), (840, 270)], fill=(99, 102, 241), width=4)
    
    # Next Block
    draw.rounded_rectangle([(840, 160), (1080, 380)], radius=12, fill=(15, 23, 42), outline=(30, 41, 59), width=1)
    draw.text((860, 185), "BLOCK #19611", fill=(148, 163, 184))
    draw.text((860, 220), "Next Mined Block...", fill=(100, 116, 139))
    
    frames.append(img)

# ==========================================
# SCENE 4: Verification Success Card
# ==========================================
for step in range(4):
    img, draw = create_base_canvas()
    
    draw.rounded_rectangle([(WIDTH//2 - 180, 30), (WIDTH//2 + 180, 65)], radius=18, fill=(15, 23, 42), outline=(16, 185, 129), width=1)
    draw.text((WIDTH//2 - 145, 40), "STEP 4: MULTI-MODAL VERIFICATION", fill=(16, 185, 129))
    
    # Verification Card
    cx, cy = WIDTH//2, HEIGHT//2 + 25
    cw, ch = 680, 320
    draw.rounded_rectangle([(cx - cw//2, cy - ch//2), (cx + cw//2, cy + ch//2)], radius=16, fill=(15, 23, 42), outline=(16, 185, 129), width=2)
    
    # Green Top Banner
    draw.rounded_rectangle([(cx - cw//2, cy - ch//2), (cx + cw//2, cy - ch//2 + 60)], radius=16, fill=(6, 78, 59))
    draw.text((cx - cw//2 + 25, cy - ch//2 + 18), "AUTHENTIC ACADEMIC CERTIFICATE VERIFIED", fill=(52, 211, 153))
    draw.text((cx + cw//2 - 140, cy - ch//2 + 18), "100% MATCH", fill=(255, 255, 255))
    
    draw.text((cx - cw//2 + 25, cy - ch//2 + 85), "Candidate: Saqib Ahmad Bhat", fill=(255, 255, 255))
    draw.text((cx - cw//2 + 25, cy - ch//2 + 115), "Degree: B.E. Computer Science and Engineering", fill=(129, 140, 248))
    draw.text((cx - cw//2 + 25, cy - ch//2 + 145), "Institution: Government College of Engineering, Tirunelveli", fill=(148, 163, 184))
    draw.text((cx - cw//2 + 25, cy - ch//2 + 175), "Blockchain ID: UN01-CERT-8UES57-20261103", fill=(56, 189, 248))
    
    # Hash check box
    draw.rounded_rectangle([(cx - cw//2 + 25, cy - ch//2 + 215), (cx + cw//2 - 25, cy - ch//2 + 295)], radius=8, fill=(11, 15, 25), outline=(30, 41, 59), width=1)
    draw.text((cx - cw//2 + 40, cy - ch//2 + 225), "Calculated SHA-256 Digest: 0x27806045a67e80de57662012c5bc1cf00f50d1cfeb5d...", fill=(148, 163, 184))
    draw.text((cx - cw//2 + 40, cy - ch//2 + 245), "Smart Contract Record:    0x27806045a67e80de57662012c5bc1cf00f50d1cfeb5d...", fill=(52, 211, 153))
    draw.text((cx - cw//2 + 40, cy - ch//2 + 268), "Verification Mode: SHA-256 PDF Binary Buffer Match  •  Network: Ethereum EVM", fill=(100, 116, 139))
    
    frames.append(img)

# ==========================================
# SCENE 5: Grand Project Hero Card (Final Frame)
# ==========================================
for step in range(8):
    img, draw = create_base_canvas()
    
    # Status Badge
    draw.rounded_rectangle([(WIDTH//2 - 160, 45), (WIDTH//2 + 160, 78)], radius=16, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
    draw.text((WIDTH//2 - 120, 53), "ACADEMIC SOFTWARE SHOWCASE", fill=(56, 189, 248))
    
    # Main Title
    draw.text((WIDTH//2 - 280, 110), "EMERTECH CERTIFY", fill=(255, 255, 255))
    
    # Tagline
    draw.text((WIDTH//2 - 260, 180), "Every certificate has a story. Every claim deserves proof.", fill=(129, 140, 248))
    
    # Subtitle
    draw.text((WIDTH//2 - 310, 220), "AI-Assisted Blockchain-Based Academic Certificate Verification System", fill=(148, 163, 184))
    
    # Feature Pills
    pills = [
        ("Ethereum EVM", (56, 189, 248)),
        ("Solidity ^0.8.19", (129, 140, 248)),
        ("SHA-256 (bytes32)", (52, 211, 153)),
        ("Tesseract.js OCR", (245, 158, 11)),
        ("React 19 SPA", (56, 189, 248)),
        ("Tamper Detection", (244, 63, 94))
    ]
    total_w = len(pills) * 165
    start_x = (WIDTH - total_w) // 2
    for i, (label, col) in enumerate(pills):
        px = start_x + (i * 165)
        draw.rounded_rectangle([(px, 280), (px + 150, 316)], radius=8, fill=(15, 23, 42), outline=col, width=1)
        draw.text((px + 16, 290), label, fill=col)
        
    # Maintainer Card
    draw.rounded_rectangle([(WIDTH//2 - 350, 360), (WIDTH//2 + 350, 440)], radius=12, fill=(15, 23, 42), outline=(30, 41, 59), width=1)
    draw.text((WIDTH//2 - 320, 375), "Developed & Maintained by Saqib Ahmad Bhat", fill=(255, 255, 255))
    draw.text((WIDTH//2 - 320, 405), "B.E. Computer Science and Engineering  •  Government College of Engineering, Tirunelveli", fill=(148, 163, 184))
    
    # Save the static fallback image from the last step
    if step == 7:
        img.save(output_png)
        print(f"Saved static hero PNG: {output_png}")
        
    frames.append(img)

# Save animated hero GIF
frames[0].save(
    output_gif,
    save_all=True,
    append_images=frames[1:],
    duration=750,
    loop=0,
    optimize=True
)
print(f"Successfully generated {output_gif} ({len(frames)} frames, size: {os.path.getsize(output_gif) / (1024*1024):.2f} MB)")
