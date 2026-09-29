{
  "brand": {
    "name": "Sole Serenity",
    "tagline": "Clean • Protect • Restore",
    "personality": [
      "premium",
      "modern",
      "trustworthy",
      "high-end streetwear",
      "minimal but visually impressive",
      "mobile-first",
      "fast and frictionless booking"
    ],
    "logo": {
      "primary_on_dark": {
        "path": "/app/frontend/src/assets/logo-white.png",
        "usage": [
          "Header (sticky)",
          "Footer",
          "Hero lockup",
          "Auth screens",
          "Email templates"
        ]
      },
      "secondary_on_light": {
        "path": "/app/frontend/src/assets/logo-black.png",
        "usage": [
          "Printable pages (labels/invoices)",
          "Light cards if ever used"
        ]
      },
      "placement_rules": [
        "Always pair logo with generous breathing room (min 12px padding on mobile, 16–20px desktop).",
        "Never place logo on busy imagery without a solid scrim behind it.",
        "Logo should link to Home and include data-testid=\"site-logo-link\"."
      ]
    }
  },

  "design_system": {
    "mode": "dark-first",
    "notes": [
      "Premium black/dark charcoal surfaces with white typography and mint/teal accent.",
      "Use subtle texture/noise + brush-stroke accents (SVG) to avoid flatness.",
      "No purple gradients. Gradients limited to decorative section backgrounds only (<=20% viewport).",
      "Avoid generic centered layouts; use left-aligned editorial hierarchy with strong typographic rhythm."
    ],

    "color_tokens": {
      "css_variables_location": "/app/frontend/src/index.css (:root and .dark)",
      "palette_hex": {
        "charcoal_950": "#0B0D0E",
        "charcoal_900": "#0F1214",
        "charcoal_850": "#14181B",
        "surface_800": "#171C20",
        "surface_750": "#1C2227",
        "border_700": "#2A3238",
        "text_primary": "#F5F7F8",
        "text_muted": "#B7C0C7",
        "mint_500": "#2EE6C5",
        "mint_600": "#18C9AB",
        "mint_300": "#7AF3DE",
        "warning": "#F5C451",
        "danger": "#FF5A6A",
        "success": "#2EE6C5",
        "info": "#6FD3FF"
      },
      "shadcn_hsl_suggestion": {
        "background": "210 18% 5%",
        "foreground": "0 0% 98%",
        "card": "210 18% 8%",
        "card_foreground": "0 0% 98%",
        "popover": "210 18% 8%",
        "popover_foreground": "0 0% 98%",
        "primary": "168 78% 54%",
        "primary_foreground": "210 18% 8%",
        "secondary": "210 16% 14%",
        "secondary_foreground": "0 0% 98%",
        "muted": "210 16% 14%",
        "muted_foreground": "210 10% 72%",
        "accent": "168 78% 54%",
        "accent_foreground": "210 18% 8%",
        "destructive": "354 90% 62%",
        "destructive_foreground": "0 0% 98%",
        "border": "210 14% 20%",
        "input": "210 14% 20%",
        "ring": "168 78% 54%",
        "radius": "0.75rem"
      },
      "semantic_colors": {
        "surface": {
          "page": "bg-[color:var(--ss-bg)]",
          "section": "bg-[color:var(--ss-surface)]",
          "card": "bg-[color:var(--ss-card)]"
        },
        "text": {
          "primary": "text-[color:var(--ss-fg)]",
          "muted": "text-[color:var(--ss-muted)]",
          "inverted": "text-[color:var(--ss-bg)]"
        },
        "interactive": {
          "primary": "bg-[color:var(--ss-mint)] text-[color:var(--ss-bg)]",
          "primary_hover": "hover:bg-[color:var(--ss-mint-600)]",
          "focus_ring": "focus-visible:ring-[color:var(--ss-mint)]"
        }
      },
      "gradient_policy": {
        "restriction": [
          "NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.",
          "NEVER let gradients cover more than 20% of the viewport.",
          "NEVER apply gradients to text-heavy content or reading areas.",
          "NEVER use gradients on small UI elements (<100px width).",
          "NEVER stack multiple gradient layers in the same viewport."
        ],
        "allowed": [
          "Hero background only: subtle charcoal-to-charcoal with a faint mint haze.",
          "Decorative overlays (noise + soft radial mint glow) behind imagery.",
          "Large section separators (top/bottom) as a 1–2px highlight line."
        ],
        "safe_examples": [
          "background: radial-gradient(600px circle at 20% 10%, rgba(46,230,197,0.14), transparent 55%), radial-gradient(700px circle at 80% 30%, rgba(111,211,255,0.10), transparent 60%);"
        ]
      }
    },

    "typography": {
      "google_fonts": {
        "display": {
          "name": "Bebas Neue",
          "usage": "Hero + section headlines (streetwear poster energy)",
          "fallback": "Impact, system-ui"
        },
        "body": {
          "name": "Space Grotesk",
          "usage": "Body, UI labels, forms (clean, modern, premium)",
          "fallback": "Inter, system-ui"
        },
        "mono_optional": {
          "name": "JetBrains Mono",
          "usage": "Order IDs, tracking codes, admin table numeric columns"
        }
      },
      "scale_tailwind": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-[var(--ss-font-display)] tracking-tight",
        "h2": "text-base md:text-lg font-medium text-[color:var(--ss-muted)]",
        "section_title": "text-3xl sm:text-4xl font-[var(--ss-font-display)] tracking-wide",
        "body": "text-sm sm:text-base leading-relaxed",
        "small": "text-xs sm:text-sm text-[color:var(--ss-muted)]"
      },
      "copy_rules": [
        "Use short, confident sentences. Avoid hype. Emphasize process + trust.",
        "Always include expectation-setting line near gallery/services: results vary by material/age/condition."
      ]
    },

    "spacing_and_layout": {
      "grid": {
        "container": "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
        "section_padding": "py-14 sm:py-18 lg:py-22",
        "bento": "grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12"
      },
      "mobile_first_rules": [
        "Tap targets: min-h-11 (44px) for buttons/inputs.",
        "Forms: single column on mobile; summary collapses into sticky bottom sheet.",
        "Avoid dense tables on mobile; use cards + key-value rows."
      ]
    },

    "texture_and_brand_motifs": {
      "noise_overlay": {
        "css_snippet": ".ss-noise::before{content:'';position:absolute;inset:0;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.08%22/%3E%3C/svg%3E');mix-blend-mode:overlay;pointer-events:none;border-radius:inherit;}",
        "usage": "Apply to hero background, large cards, and admin dashboard header only (not everywhere)."
      },
      "brush_stroke": {
        "direction": "Use a thin brush-stroke SVG underline behind key words (e.g., 'SECOND CHANCE', 'BOOK A CLEAN'). Keep opacity 0.12–0.18 and mint tint.",
        "implementation": "Inline SVG absolutely positioned behind text; do not use emoji icons."
      }
    },

    "elevation_and_radius": {
      "radius": {
        "card": "rounded-xl",
        "button": "rounded-lg",
        "pill_badge": "rounded-full"
      },
      "shadows": {
        "card": "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "hover_lift": "hover:translate-y-[-1px] hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
      },
      "borders": {
        "default": "border border-[color:var(--ss-border)]",
        "accent": "border border-[color:rgba(46,230,197,0.35)]"
      }
    },

    "motion": {
      "library": {
        "recommended": "framer-motion",
        "install": "npm i framer-motion",
        "usage": [
          "Hero content reveal (fade + slight y)",
          "Step transitions in booking flow",
          "Gallery image hover + modal open",
          "Admin KPI cards stagger"
        ]
      },
      "principles": [
        "Use 160–220ms for hover transitions; 240–360ms for page/step transitions.",
        "Prefer opacity + translateY (2–8px). Avoid excessive scaling.",
        "Respect prefers-reduced-motion: disable parallax and large entrance animations."
      ]
    },

    "accessibility": {
      "rules": [
        "WCAG AA contrast: white text on charcoal; mint used for accents and focus rings.",
        "Always show focus-visible ring (2px) in mint.",
        "Error messages must be explicit text (not color-only).",
        "All form fields have labels (visible, not placeholder-only)."
      ]
    }
  },

  "component_library": {
    "primary": "shadcn/ui (already in /app/frontend/src/components/ui)",
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "radio_group": "/app/frontend/src/components/ui/radio-group.jsx",
      "checkbox": "/app/frontend/src/components/ui/checkbox.jsx",
      "progress": "/app/frontend/src/components/ui/progress.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "accordion": "/app/frontend/src/components/ui/accordion.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx"
    },
    "custom_components_to_build": [
      {
        "name": "StickyHeader",
        "purpose": "Premium sticky nav with BOOK A CLEAN CTA",
        "notes": "Use NavigationMenu + Button; add subtle blur backdrop and border."
      },
      {
        "name": "HeroLockup",
        "purpose": "Hero with headline, subhead, CTAs, trust badges, and a before/after teaser",
        "notes": "Use Card + AspectRatio + Dialog for gallery preview."
      },
      {
        "name": "ServiceSelector",
        "purpose": "Quick Clean vs Deep Clean selection with price + what’s included",
        "notes": "Use RadioGroup + Cards; show mint outline on selected."
      },
      {
        "name": "BookingStepper",
        "purpose": "Multi-step booking flow with progress + validation",
        "notes": "Use Progress + Tabs or custom stepper; keep large tap targets."
      },
      {
        "name": "GuidedPhotoUploader",
        "purpose": "6-slot guided photo capture with previews and retake",
        "notes": "Use Input type=file + Card slots + Dialog preview; mobile camera friendly."
      },
      {
        "name": "PriceCalculator",
        "purpose": "Live total with tier pricing + shipping",
        "notes": "Sticky summary on mobile via Drawer; desktop sidebar Card."
      },
      {
        "name": "OrderStatusTimeline",
        "purpose": "18-step status timeline with current step highlight",
        "notes": "Use vertical timeline layout; Badge for status; include timestamps."
      },
      {
        "name": "AdminKpiCards",
        "purpose": "Dashboard KPI cards with sparklines (optional)",
        "notes": "Use Card; optional Recharts for mini charts."
      }
    ]
  },

  "status_system": {
    "order_statuses": [
      "PENDING_ASSESSMENT",
      "NEEDS_MORE_PHOTOS",
      "DECLINED",
      "APPROVED",
      "AWAITING_PAYMENT",
      "PAID",
      "LABEL_GENERATED",
      "AWAITING_SHIPMENT",
      "SHOES_IN_TRANSIT_TO_US",
      "SHOES_RECEIVED",
      "CLEANING",
      "RESTORATION",
      "DRYING",
      "QUALITY_CHECK",
      "READY_FOR_RETURN",
      "RETURN_IN_TRANSIT",
      "DELIVERED",
      "COMPLETED"
    ],
    "badge_mapping": {
      "PENDING_ASSESSMENT": {"variant": "secondary", "accent": "mint", "label": "Pending assessment"},
      "NEEDS_MORE_PHOTOS": {"variant": "outline", "accent": "warning", "label": "More photos needed"},
      "DECLINED": {"variant": "destructive", "accent": "danger", "label": "Declined"},
      "APPROVED": {"variant": "default", "accent": "mint", "label": "Approved"},
      "AWAITING_PAYMENT": {"variant": "outline", "accent": "info", "label": "Awaiting payment"},
      "PAID": {"variant": "default", "accent": "success", "label": "Paid"},
      "LABEL_GENERATED": {"variant": "secondary", "accent": "info", "label": "Label generated"},
      "AWAITING_SHIPMENT": {"variant": "secondary", "accent": "info", "label": "Awaiting shipment"},
      "SHOES_IN_TRANSIT_TO_US": {"variant": "secondary", "accent": "info", "label": "In transit to us"},
      "SHOES_RECEIVED": {"variant": "default", "accent": "mint", "label": "Shoes received"},
      "CLEANING": {"variant": "secondary", "accent": "mint", "label": "Cleaning"},
      "RESTORATION": {"variant": "secondary", "accent": "mint", "label": "Restoration"},
      "DRYING": {"variant": "secondary", "accent": "mint", "label": "Drying"},
      "QUALITY_CHECK": {"variant": "outline", "accent": "mint", "label": "Quality check"},
      "READY_FOR_RETURN": {"variant": "default", "accent": "mint", "label": "Ready for return"},
      "RETURN_IN_TRANSIT": {"variant": "secondary", "accent": "info", "label": "Return in transit"},
      "DELIVERED": {"variant": "default", "accent": "success", "label": "Delivered"},
      "COMPLETED": {"variant": "default", "accent": "success", "label": "Completed"}
    },
    "timeline_ui": {
      "current_step_style": "ring-2 ring-[color:var(--ss-mint)] bg-[color:rgba(46,230,197,0.12)]",
      "completed_step_style": "bg-[color:rgba(46,230,197,0.10)] border-[color:rgba(46,230,197,0.35)]",
      "upcoming_step_style": "bg-[color:rgba(255,255,255,0.02)] border-[color:var(--ss-border)]"
    }
  },

  "page_blueprints": {
    "global_shell": {
      "header": {
        "layout": "Sticky top header with subtle blur + border; left logo, center nav (desktop), right BOOK A CLEAN button.",
        "mobile": "Hamburger opens Sheet with nav links + BOOK A CLEAN button pinned at bottom.",
        "data_testids": {
          "header": "site-header",
          "mobile_menu_button": "mobile-nav-open-button",
          "book_cta": "header-book-a-clean-button"
        }
      },
      "footer": {
        "layout": "3-column on desktop: logo+tagline+trust badges, nav, legal+social. Stack on mobile.",
        "trust_row": "UK-WIDE DELIVERY • TRACKED SHIPPING • PHOTO ASSESSMENT BEFORE YOU PAY",
        "data_testids": {
          "footer": "site-footer",
          "tiktok_link": "footer-tiktok-link",
          "instagram_link": "footer-instagram-link"
        }
      }
    },

    "home": {
      "hero": {
        "headline": "GIVE YOUR SHOES A SECOND CHANCE",
        "subhead": "Professional shoe cleaning. Delivered straight to your door.",
        "ctas": [
          {"primary": "BOOK A CLEAN", "data-testid": "hero-book-a-clean-button"},
          {"secondary": "HOW IT WORKS", "data-testid": "hero-how-it-works-button"}
        ],
        "trust_badges": [
          "UK-WIDE DELIVERY",
          "TRACKED SHIPPING",
          "PHOTO ASSESSMENT BEFORE YOU PAY",
          "SECURE PAYMENT (Stripe)"
        ],
        "layout_notes": [
          "Mobile: hero copy first, then trust badges, then a single before/after teaser card.",
          "Desktop: split layout (copy left, gallery teaser right)."
        ]
      },
      "sections": [
        "Services teaser (Quick vs Deep)",
        "How it works (4 steps)",
        "Before & After gallery (masonry)",
        "Reviews/testimonials",
        "FAQ accordion",
        "Contact CTA"
      ]
    },

    "services": {
      "layout": "Two primary service cards with comparison table below (what’s included, turnaround, best for).",
      "cta": "BOOK A CLEAN",
      "data_testids": {
        "quick_clean_card": "services-quick-clean-card",
        "deep_clean_card": "services-deep-clean-card"
      }
    },

    "book_a_clean_flow": {
      "steps": [
        {
          "name": "Service & pairs",
          "ui": "ServiceSelector + pair count (1–4) + per-pair service assignment",
          "validation": "Require at least 1 pair; each pair must have a service",
          "data_testids": {
            "pair_count": "booking-pair-count-select",
            "continue": "booking-step-1-continue-button"
          }
        },
        {
          "name": "Photos",
          "ui": "GuidedPhotoUploader with slots: front, left, right, back, soles, problem areas",
          "notes": "Allow submit with missing optional 'problem areas' but require the 5 core angles.",
          "data_testids": {
            "photo_slot_front": "booking-photo-front-input",
            "photo_slot_soles": "booking-photo-soles-input"
          }
        },
        {
          "name": "Shoe details",
          "ui": "Brand/model, size (UK), material, color, notes",
          "data_testids": {
            "shoe_brand": "booking-shoe-brand-input",
            "shoe_size": "booking-shoe-size-input"
          }
        },
        {
          "name": "Delivery details",
          "ui": "Name, email, phone, UK address, preferred return option",
          "notes": "Use Address fields optimized for mobile; consider postcode lookup later.",
          "data_testids": {
            "address_line1": "booking-address-line1-input",
            "postcode": "booking-postcode-input"
          }
        },
        {
          "name": "Review & submit",
          "ui": "Summary card + edit links + submit for assessment",
          "trust_copy": "You’ll only pay after we assess your photos and confirm what’s possible.",
          "data_testids": {
            "submit": "booking-submit-for-assessment-button"
          }
        }
      ],
      "sticky_summary": {
        "mobile": "Sticky bottom bar with total + 'Continue' / 'Submit' button; tap opens Drawer with full breakdown.",
        "desktop": "Right sidebar Card with breakdown + shipping + estimated turnaround."
      },
      "price_calculator": {
        "rules": [
          "Show per-pair price, multi-pair tier discount, shipping line item.",
          "Always show 'Assessment required' note if admin can adjust price after review."
        ]
      }
    },

    "customer_portal": {
      "layout": "Top: order summary + status badge + next action (upload more photos / pay / download label / track). Below: timeline + photo grid + messages.",
      "components": [
        "OrderStatusTimeline",
        "PhotoGrid (Dialog preview)",
        "Payment CTA (Stripe)"
      ],
      "data_testids": {
        "status_badge": "order-status-badge",
        "pay_now": "order-pay-now-button",
        "tracking_link": "order-royal-mail-tracking-link",
        "label_download": "order-label-download-link"
      }
    },

    "admin": {
      "login": {
        "layout": "Centered card but left-aligned text; logo at top; minimal fields.",
        "data_testids": {
          "email": "admin-login-email-input",
          "password": "admin-login-password-input",
          "submit": "admin-login-submit-button"
        }
      },
      "dashboard": {
        "layout": "KPI cards grid + orders table preview + alerts (pending assessments, awaiting payment).",
        "components": [
          "AdminKpiCards",
          "Table",
          "Tabs for filters"
        ]
      },
      "orders_list": {
        "layout": "Filters row (status, date range, search) + table; mobile uses cards.",
        "data_testids": {
          "status_filter": "admin-orders-status-filter",
          "search": "admin-orders-search-input"
        }
      },
      "order_detail": {
        "layout": "Left: customer + address + pricing + actions. Right: photo grid + timeline.",
        "actions": [
          "Approve",
          "Decline",
          "Request more photos",
          "Update status",
          "Upload/generate label",
          "Refund"
        ]
      },
      "settings": {
        "layout": "Tabs: Business, Pricing, Shipping, FAQ, Gallery, Social, Analytics.",
        "notes": "Use Form + Tabs; keep save button sticky on mobile."
      }
    }
  },

  "images": {
    "image_urls": [
      {
        "category": "hero_background_optional",
        "description": "Dark, abstract texture or studio sneaker-care vibe. Use as subtle background with heavy scrim.",
        "url": "https://images.unsplash.com/photo-1651056223915-b709056e0dc5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwY2xlYW5pbmclMjBicnVzaCUyMGNsb3NlJTIwdXAlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8YmxhY2t8MTc4ODg2NDg2N3ww&ixlib=rb-4.1.0&q=85"
      }
    ],
    "notes": [
      "Image provider tool had limited results; consider adding your own before/after photos ASAP for authenticity.",
      "Gallery should prioritize real customer results; add tasteful disclaimer: results vary by material/age/condition."
    ]
  },

  "implementation_notes": {
    "instructions_to_main_agent": [
      "Update /app/frontend/src/index.css tokens: replace :root/.dark HSL values to match Sole Serenity palette; default app should run in dark mode (add class 'dark' on html/body root).",
      "Remove CRA demo styles in /app/frontend/src/App.css (App-header centering etc). Do NOT add .App { text-align:center }.",
      "Use shadcn/ui components from /app/frontend/src/components/ui only for inputs, dialogs, sheets, tables, accordion, calendar.",
      "All interactive and key informational elements MUST include data-testid attributes (kebab-case).",
      "Primary CTA label everywhere: BOOK A CLEAN. Secondary CTA: HOW IT WORKS.",
      "Booking flow: implement sticky summary bottom bar on mobile using Drawer; desktop uses right sidebar Card.",
      "Order tracking: implement timeline with 18 statuses + badge mapping; show next action CTA based on status.",
      "Admin: tables on desktop; card list on mobile; keep filters accessible and not cramped.",
      "Use sonner for toasts (success/error) and ensure toast messages are actionable and concise."
    ],
    "recommended_extra_libs": [
      {
        "name": "framer-motion",
        "why": "Premium motion for hero/step transitions",
        "install": "npm i framer-motion"
      },
      {
        "name": "recharts",
        "why": "Admin KPI sparklines and revenue charts",
        "install": "npm i recharts"
      }
    ]
  }
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
