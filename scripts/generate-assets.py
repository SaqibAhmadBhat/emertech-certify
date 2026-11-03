#!/usr/bin/env python3
"""
Generate social preview and architecture diagram assets for Emertech Certify.
- assets/social-preview.png (1280x640)
- assets/architecture.png (1400x820)
Copies to presentation/assets/ as well.
"""

import os
import shutil
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    try:
        idx = 1 if bold else 0
        return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', size, index=idx)
    except Exception:
        try:
            return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', size)
        except Exception:
            return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def generate_social_preview():
    W, H = 1280, 640
    img = Image.new('RGB', (W, H), '#0B0F19')
    draw = ImageDraw.Draw(img)

    # Subtle grid background
    grid_color = '#131A29'
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=grid_color, width=1)
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=grid_color, width=1)

    # Gradient glow simulation (circles with low opacity)
    glow_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_overlay)
    glow_draw.ellipse([W//2 - 400, -100, W//2 + 400, 400], fill=(56, 189, 248, 28))
    glow_draw.ellipse([W//2 - 250, 100, W//2 + 250, 500], fill=(129, 140, 248, 22))
    img.paste(Image.alpha_composite(Image.new('RGBA', (W, H), (11, 15, 25, 255)), glow_overlay).convert('RGB'))
    draw = ImageDraw.Draw(img)

    # Border frame
    draw.rectangle([(0, 0), (W-1, H-1)], outline='#1E293B', width=2)

    # Top Tag / Pill
    font_badge = get_font(13, bold=True)
    draw_rounded_rect(draw, (W//2 - 230, 45, W//2 + 230, 75), radius=15, fill='#161F30', outline='#38BDF8', width=1)
    draw.ellipse([W//2 - 215, 57, W//2 - 207, 65], fill='#10B981')
    draw.text((W//2 - 195, 52), "IMMUTABLE ACADEMIC CREDENTIAL INFRASTRUCTURE", font=font_badge, fill='#94A3B8')

    # Main Title
    font_title = get_font(48, bold=True)
    title_text = "EMERTECH CERTIFY"
    bbox = font_title.getbbox(title_text)
    tw = bbox[2] - bbox[0]
    draw.text((W//2 - tw//2, 95), title_text, font=font_title, fill='#FFFFFF')

    # Tagline
    font_tag = get_font(19, bold=False)
    tag_text = "AI-Assisted Blockchain-Based Academic Certificate Verification System"
    bbox_tag = font_tag.getbbox(tag_text)
    draw.text((W//2 - (bbox_tag[2]-bbox_tag[0])//2, 160), tag_text, font=font_tag, fill='#38BDF8')

    # Visual Workflow Card Container
    card_top = 210
    card_h = 290
    draw_rounded_rect(draw, (70, card_top, W - 70, card_top + card_h), radius=12, fill='#111827', outline='#1E293B', width=1)

    # Header inside card
    font_card_head = get_font(14, bold=True)
    draw.text((95, card_top + 18), "CRYPTOGRAPHIC DUAL-LAYER VERIFICATION PIPELINE", font=font_card_head, fill='#818CF8')

    # Status Pill inside card
    draw_rounded_rect(draw, (W - 275, card_top + 14, W - 95, card_top + 40), radius=13, fill='#064E3B', outline='#10B981', width=1)
    draw.ellipse([W - 262, card_top + 23, W - 254, card_top + 31], fill='#10B981')
    font_status = get_font(12, bold=True)
    draw.text((W - 245, card_top + 20), "ON-CHAIN VERIFIED", font=font_status, fill='#A7F3D0')

    # Draw 3 Pipeline Nodes
    nodes = [
        {"title": "1. Issuance & Ingestion", "tech": "React 18 • Node.js • Tesseract.js", "desc": "PDF payload canonicalization\nOCR text feature extraction\nCryptographic QR stamping", "color": "#38BDF8"},
        {"title": "2. Cryptographic Digest", "tech": "SHA-256 • IPFS Pinning", "desc": "Deterministic 256-bit hash\nDecentralized metadata CID\nZero-knowledge verification", "color": "#818CF8"},
        {"title": "3. Ethereum Smart Contract", "tech": "Solidity ^0.8.20 • Hardhat", "desc": "Immutable ledger state\nMulti-role authorization\nInstant revocation check", "color": "#10B981"}
    ]

    card_width = 330
    card_gap = 45
    start_x = 95
    node_y = card_top + 60
    node_h = 195

    font_n_title = get_font(16, bold=True)
    font_n_tech = get_font(12, bold=False)
    font_n_desc = get_font(13, bold=False)

    for i, node in enumerate(nodes):
        nx = start_x + i * (card_width + card_gap)
        draw_rounded_rect(draw, (nx, node_y, nx + card_width, node_y + node_h), radius=8, fill='#161F30', outline=node['color'], width=1)
        draw.text((nx + 16, node_y + 16), node['title'], font=font_n_title, fill='#FFFFFF')
        draw.text((nx + 16, node_y + 42), node['tech'], font=font_n_tech, fill=node['color'])
        
        # Horizontal separator
        draw.line([(nx + 16, node_y + 65), (nx + card_width - 16, node_y + 65)], fill='#24334D', width=1)
        
        lines = node['desc'].split('\n')
        for l_idx, line in enumerate(lines):
            draw.text((nx + 16, node_y + 80 + l_idx * 26), f"• {line}", font=font_n_desc, fill='#CBD5E1')

        # Connector arrow to next node
        if i < 2:
            arrow_x = nx + card_width + 12
            arrow_y = node_y + node_h // 2
            draw.line([(arrow_x, arrow_y), (arrow_x + 20, arrow_y)], fill='#475569', width=2)
            draw.polygon([(arrow_x + 20, arrow_y - 4), (arrow_x + 28, arrow_y), (arrow_x + 20, arrow_y + 4)], fill='#475569')

    # Footer Metadata Bar
    foot_y = 535
    font_foot = get_font(13, bold=False)
    font_foot_bold = get_font(13, bold=True)
    draw.line([(70, foot_y - 12), (W - 70, foot_y - 12)], fill='#1E293B', width=1)
    
    draw.text((75, foot_y), "Developer & Architect:", font=font_foot, fill='#64748B')
    draw.text((220, foot_y), "Saqib Ahmad Bhat", font=font_foot_bold, fill='#F1F5F9')
    
    draw.text((375, foot_y), "Institution:", font=font_foot, fill='#64748B')
    draw.text((455, foot_y), "Govt. College of Engg, Tirunelveli (CSE)", font=font_foot_bold, fill='#F1F5F9')

    draw.text((770, foot_y), "Stack:", font=font_foot, fill='#64748B')
    draw.text((820, foot_y), "Ethereum • Solidity • IPFS • React • Node.js", font=font_foot_bold, fill='#38BDF8')

    draw.text((1150, foot_y), "MIT Licensed", font=font_foot, fill='#64748B')

    out_path = 'assets/social-preview.png'
    img.save(out_path, format='PNG', optimize=True)
    print(f"Generated {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")


def generate_architecture():
    W, H = 1400, 840
    img = Image.new('RGB', (W, H), '#0B0F19')
    draw = ImageDraw.Draw(img)

    # Subtle grid background
    grid_color = '#131A29'
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=grid_color, width=1)
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=grid_color, width=1)

    # Top Header
    font_head = get_font(28, bold=True)
    font_sub = get_font(15, bold=False)
    draw.text((50, 35), "EMERTECH CERTIFY — SYSTEM ARCHITECTURE & CRYPTOGRAPHIC PIPELINE", font=font_head, fill='#FFFFFF')
    draw.text((50, 75), "AI-Assisted Blockchain-Based Academic Certificate Verification System  •  Saqib Ahmad Bhat", font=font_sub, fill='#38BDF8')

    # Draw 4 Tier Cards
    tiers = [
        {
            "tier": "TIER 1: PRESENTATION LAYER",
            "tech": "React 18 • Tailwind CSS • Lucide • HTML5-QRCode",
            "color": "#38BDF8",
            "accent": "#0284C7",
            "components": [
                ("Admin Dashboard", "Institution authorization, audits & system analytics"),
                ("Institution Portal", "Single & bulk CSV certificate issuance, template preview"),
                ("Student Dashboard", "Direct credential retrieval, PDF download & QR display"),
                ("Public Verifier", "Multi-modal verification: File upload, Hash, QR, OCR scan"),
                ("Interactive Terminal", "Live dual-layer cryptographic comparison diagnostics")
            ]
        },
        {
            "tier": "TIER 2: API & BACKEND SERVICES",
            "tech": "Node.js • Express • JWT • Mongoose • Multer",
            "color": "#818CF8",
            "accent": "#4F46E5",
            "components": [
                ("Auth & RBAC Middleware", "Secure token-based role verification (Admin, Inst, Student)"),
                ("Certificate Controller", "Coordinate signing, hashing, PDF compilation & storage"),
                ("OCR Extraction Engine", "Tesseract.js worker thread for scanned image parsing"),
                ("Verification Service", "Dual-match orchestrator (On-Chain hash vs Local hash)"),
                ("Audit & Telemetry", "Event logging, failure rate tracking & security alerts")
            ]
        },
        {
            "tier": "TIER 3: CRYPTOGRAPHY & STORAGE",
            "tech": "Crypto (SHA-256) • PDF-Lib • IPFS / Pinata • MongoDB",
            "color": "#F59E0B",
            "accent": "#D97706",
            "components": [
                ("Canonical Hash Engine", "Deterministic SHA-256 digest of certificate payload"),
                ("PDF Generator & Stamper", "High-fidelity PDF creation with embedded QR & metadata"),
                ("IPFS Decentralized Storage", "Content-addressed immutable storage with Pinata gateway"),
                ("MongoDB Primary DB", "Off-chain transactional metadata, accounts & cache"),
                ("Digital Watermarking", "Tamper-evident layout and anti-forgery layout rules")
            ]
        },
        {
            "tier": "TIER 4: BLOCKCHAIN & CONSENSUS",
            "tech": "Ethereum • Solidity ^0.8.20 • Ethers.js v6 • Hardhat",
            "color": "#10B981",
            "accent": "#059669",
            "components": [
                ("CertificateRegistry.sol", "Main contract with mapping(bytes32 => Certificate)"),
                ("AccessControl / Ownable", "Authorized university wallets permitted to emit certs"),
                ("ReentrancyGuard", "OpenZeppelin battle-tested security standards"),
                ("Revocation Protocol", "Cryptographic lifecycle control for modified/cancelled certs"),
                ("Event Emits", "CertificateIssued & CertificateRevoked on-chain logs")
            ]
        }
    ]

    box_w = 300
    box_gap = 26
    start_x = 50
    box_y = 120
    box_h = 580

    font_tier_title = get_font(13, bold=True)
    font_tier_tech = get_font(11, bold=True)
    font_comp_name = get_font(13, bold=True)
    font_comp_desc = get_font(11, bold=False)

    for i, tier in enumerate(tiers):
        bx = start_x + i * (box_w + box_gap)
        # Tier card outline
        draw_rounded_rect(draw, (bx, box_y, bx + box_w, box_y + box_h), radius=10, fill='#111827', outline=tier['color'], width=2)
        
        # Header strip
        draw_rounded_rect(draw, (bx, box_y, bx + box_w, box_y + 55), radius=10, fill='#161F30', outline=tier['color'], width=1)
        draw.rectangle([(bx, box_y + 35), (bx + box_w, box_y + 55)], fill='#161F30')
        draw.text((bx + 14, box_y + 12), tier['tier'], font=font_tier_title, fill=tier['color'])
        draw.text((bx + 14, box_y + 33), tier['tech'], font=font_tier_tech, fill='#94A3B8')

        # Component sub-cards
        comp_y = box_y + 68
        for c_idx, (c_name, c_desc) in enumerate(tier['components']):
            draw_rounded_rect(draw, (bx + 10, comp_y, bx + box_w - 10, comp_y + 90), radius=6, fill='#1A2234', outline='#2D3B55', width=1)
            # Dot indicator
            draw.ellipse([bx + 20, comp_y + 15, bx + 28, comp_y + 23], fill=tier['color'])
            draw.text((bx + 36, comp_y + 11), c_name, font=font_comp_name, fill='#F1F5F9')
            
            # Multi-line desc
            words = c_desc.split()
            l1, l2 = "", ""
            for w in words:
                if len(l1 + " " + w) < 32 and not l2:
                    l1 += (" " if l1 else "") + w
                else:
                    l2 += (" " if l2 else "") + w
            draw.text((bx + 20, comp_y + 38), l1, font=font_comp_desc, fill='#94A3B8')
            if l2:
                draw.text((bx + 20, comp_y + 55), l2, font=font_comp_desc, fill='#94A3B8')

            comp_y += 100

        # Flow arrow between columns
        if i < 3:
            ax = bx + box_w + 5
            ay = box_y + box_h // 2
            draw.line([(ax, ay), (ax + 16, ay)], fill='#475569', width=2)
            draw.polygon([(ax + 14, ay - 4), (ax + 20, ay), (ax + 14, ay + 4)], fill='#475569')

    # Footer Protocol Legend
    foot_y = 725
    draw_rounded_rect(draw, (50, foot_y, W - 50, foot_y + 80), radius=8, fill='#111827', outline='#1E293B', width=1)
    
    font_leg_title = get_font(12, bold=True)
    font_leg_item = get_font(12, bold=False)
    draw.text((70, foot_y + 15), "SECURITY & VERIFICATION INVARIANTS:", font=font_leg_title, fill='#38BDF8')
    
    invariants = [
        "1. Off-Chain Privacy: PII stored in local/IPFS metadata; only cryptographic hash (bytes32) published to Ethereum blockchain.",
        "2. Deterministic Integrity: Any pixel or character alteration changes the SHA-256 digest, triggering an immediate mismatch.",
        "3. Multi-Modal Verifier: Verification succeeds equally via Direct File Hash, QR Code Payload, Blockchain Hash, or OCR."
    ]
    for idx, inv in enumerate(invariants):
        draw.text((70, foot_y + 36 + idx * 16), inv, font=font_leg_item, fill='#CBD5E1')

    out_path = 'assets/architecture.png'
    img.save(out_path, format='PNG', optimize=True)
    print(f"Generated {out_path} ({os.path.getsize(out_path)/1024:.1f} KB)")

if __name__ == '__main__':
    os.makedirs('assets', exist_ok=True)
    os.makedirs('presentation/assets', exist_ok=True)
    generate_social_preview()
    generate_architecture()

    # Copy to presentation/assets
    for filename in ['social-preview.png', 'architecture.png', 'emertech-certify-hero.gif', 'emertech-certify-hero.png', 'certificate-verification-demo.gif']:
        src = os.path.join('assets', filename)
        dst = os.path.join('presentation/assets', filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Copied {src} -> {dst}")
