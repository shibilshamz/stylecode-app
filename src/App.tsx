import { useState } from "react";
import { getStyleAdvice } from "./geminiAdvisor";
import type { StyleResult, StyleProfile } from "./geminiAdvisor";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Static data ─────────────────────────────────────────────────────────────

const SKIN_TONES = [
  { id: "Fair",        label: "Fair",        hex: "#F2D4B8" },
  { id: "Light Wheat", label: "Light Wheat", hex: "#E0AA7A" },
  { id: "Wheat",       label: "Wheat",       hex: "#C4854A" },
  { id: "Dusky",       label: "Dusky",       hex: "#9B6035" },
  { id: "Deep Brown",  label: "Deep Brown",  hex: "#6B3A1E" },
  { id: "Very Deep",   label: "Very Deep",   hex: "#3C1C0A" },
];

const BODY_SHAPES = [
  { id: "Slim",      label: "Slim",      desc: "Lean frame, narrow shoulders & hips" },
  { id: "Athletic",  label: "Athletic",  desc: "Broad shoulders, V-taper to waist" },
  { id: "Rectangle", label: "Rectangle", desc: "Even width from shoulder to hip" },
  { id: "Oval",      label: "Oval",      desc: "Fuller midsection, rounder belly" },
  { id: "Broad Top", label: "Broad Top", desc: "Wide shoulders & chest, narrower hip" },
];

const HEIGHTS = [
  { id: "Under 5'6\"",  label: "Under 5'6\"",    sub: "Petite frame" },
  { id: "5'6\"–5'10\"", label: "5'6\" – 5'10\"", sub: "Average height" },
  { id: "Above 5'10\"", label: "Above 5'10\"",   sub: "Tall frame" },
];

const OCCASIONS = [
  { id: "Office",           label: "Office",           icon: "○" },
  { id: "Casual",           label: "Casual",           icon: "◇" },
  { id: "Date Night",       label: "Date Night",       icon: "◆" },
  { id: "Wedding / Ethnic", label: "Wedding / Ethnic", icon: "✦" },
  { id: "Gym",              label: "Gym",              icon: "△" },
  { id: "Beach",            label: "Beach",            icon: "◯" },
];

const STEPS       = ["Skin Tone", "Body Shape", "Height", "Occasion"];
const MATCH_STEPS = ["Skin Tone", "Upload"];

// ─── Match My Clothes interfaces ──────────────────────────────────────────────

interface MatchColour {
  name: string;
  hex: string;
  pantone: string;
  realWorldRef: string;
  reason: string;
}

interface MatchOutfit {
  name: string;
  occasion: string;
  colours: string[];
  why: string;
}

interface MatchAvoid {
  colour: string;
  hex: string;
  reason: string;
}

interface MatchResult {
  item: string;
  itemColour: string;
  itemHex: string;
  matches: MatchColour[];
  outfits: MatchOutfit[];
  avoid: MatchAvoid[];
}

// ─── SVG Silhouettes ─────────────────────────────────────────────────────────

function SlimSilhouette() {
  return (
    <svg viewBox="0 0 50 92" fill="currentColor" aria-hidden="true">
      <ellipse cx="25" cy="8" rx="6" ry="7" />
      <rect x="22" y="14" width="6" height="5" />
      <polygon points="17,19 33,19 30,46 20,46" />
      <polygon points="20,46 30,46 28,88 22,88" />
    </svg>
  );
}

function AthleticSilhouette() {
  return (
    <svg viewBox="0 0 50 92" fill="currentColor" aria-hidden="true">
      <ellipse cx="25" cy="8" rx="6" ry="7" />
      <rect x="22" y="14" width="6" height="5" />
      <polygon points="6,19 44,19 31,46 19,46" />
      <polygon points="19,46 31,46 29,88 21,88" />
    </svg>
  );
}

function RectangleSilhouette() {
  return (
    <svg viewBox="0 0 50 92" fill="currentColor" aria-hidden="true">
      <ellipse cx="25" cy="8" rx="6" ry="7" />
      <rect x="22" y="14" width="6" height="5" />
      <polygon points="15,19 35,19 35,46 15,46" />
      <polygon points="15,46 35,46 35,88 15,88" />
    </svg>
  );
}

function OvalSilhouette() {
  return (
    <svg viewBox="0 0 50 92" fill="currentColor" aria-hidden="true">
      <ellipse cx="25" cy="8" rx="6" ry="7" />
      <rect x="22" y="14" width="6" height="5" />
      <polygon points="17,19 33,19 40,46 10,46" />
      <polygon points="13,46 37,46 32,88 18,88" />
    </svg>
  );
}

function BroadTopSilhouette() {
  return (
    <svg viewBox="0 0 50 92" fill="currentColor" aria-hidden="true">
      <ellipse cx="25" cy="8" rx="6" ry="7" />
      <rect x="22" y="14" width="6" height="5" />
      <polygon points="3,19 47,19 32,46 18,46" />
      <polygon points="18,46 32,46 30,88 20,88" />
    </svg>
  );
}

const SILHOUETTE_MAP: Record<string, () => React.JSX.Element> = {
  "Slim":      SlimSilhouette,
  "Athletic":  AthleticSilhouette,
  "Rectangle": RectangleSilhouette,
  "Oval":      OvalSilhouette,
  "Broad Top": BroadTopSilhouette,
};

// ─── Shared step header ───────────────────────────────────────────────────────

function StepHeader({
  step, title, subtitle, steps = STEPS,
}: {
  step: number; title: string; subtitle: string; steps?: string[];
}) {
  return (
    <div className="step-header">
      <div className="step-progress">
        {steps.map((s, i) => (
          <div key={s} className={`step-dot ${i < step ? "done" : i === step - 1 ? "active" : ""}`}>
            <span className="dot-num">{i + 1}</span>
            <span className="dot-label">{s}</span>
          </div>
        ))}
      </div>
      <h2 className="step-title">{title}</h2>
      <p className="step-sub">{subtitle}</p>
    </div>
  );
}

// ─── Style Profile result components ─────────────────────────────────────────

function Palette({ swatches }: { swatches: { name: string; hex: string; pantone: string; realWorldRef: string }[] }) {
  return (
    <div className="palette-row">
      {swatches.map((s) => (
        <div key={s.name} className="palette-item">
          <div className="palette-swatch" style={{ background: s.hex }} />
          <span className="palette-name">{s.name}</span>
          <span className="palette-pantone">{s.pantone}</span>
          <span className="palette-realworld">"{s.realWorldRef}"</span>
        </div>
      ))}
    </div>
  );
}

function OutfitFigure({ colors }: { colors: { hex: string }[] }) {
  const shirt    = colors[0]?.hex ?? "#BDB3A4";
  const trousers = colors[1]?.hex ?? "#8A7E72";
  const jacket   = colors[2]?.hex;

  return (
    <svg viewBox="0 0 80 132" className="outfit-figure" aria-hidden="true">
      {/* shadow */}
      <ellipse cx="40" cy="128" rx="15" ry="3" fill="rgba(0,0,0,0.07)" />
      {/* trousers — two legs with a small gap */}
      <polygon points="24,73 39,73 37,125 22,125" fill={trousers} />
      <polygon points="41,73 56,73 58,125 43,125" fill={trousers} />
      {/* shirt */}
      <polygon points="18,28 62,28 56,73 24,73" fill={shirt} />
      {/* jacket panels (optional) */}
      {jacket && (
        <>
          <polygon points="18,28 40,28 35,47 27,73 24,73" fill={jacket} />
          <polygon points="40,28 62,28 56,73 53,73 45,47" fill={jacket} />
        </>
      )}
      {/* neck */}
      <rect x="36" y="21" width="8" height="9" fill="#C8936A" />
      {/* head */}
      <ellipse cx="40" cy="12" rx="10" ry="11" fill="#C8936A" />
    </svg>
  );
}

function OutfitCard({ outfit }: { outfit: StyleResult["outfits"][0] }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = "https://loremflickr.com/400/500/mens,fashion,outfit";

  return (
    <div className="outfit-card">
      <div className={`outfit-figure-area${imgError ? "" : " outfit-figure-area--photo"}`}>
        {imgError ? (
          <OutfitFigure colors={outfit.colors} />
        ) : (
          <img
            src={photoUrl}
            alt={outfit.name}
            className="outfit-photo"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="outfit-body">
        <div className="outfit-top">
          <span className="outfit-name">{outfit.name}</span>
          <span className="outfit-badge">{outfit.occasion}</span>
        </div>
        <p className="outfit-why">{outfit.why}</p>
        <div className="outfit-color-chips">
          {outfit.colors.map((c, i) => (
            <div key={i} className="outfit-color-chip" style={{ background: c.hex }} title={c.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Match My Clothes result components ───────────────────────────────────────

function MatchOutfitCard({ outfit }: { outfit: MatchOutfit }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = "https://loremflickr.com/400/500/mens,fashion,outfit";

  return (
    <div className="outfit-card">
      {imgError ? (
        <div className="match-outfit-colors">
          {outfit.colours.map((c, i) => (
            <div key={i} className="match-outfit-color-block" style={{ background: c, flex: i === 0 ? 2 : 1 }} />
          ))}
        </div>
      ) : (
        <img
          src={photoUrl}
          alt={outfit.name}
          className="outfit-photo"
          onError={() => setImgError(true)}
        />
      )}
      <div className="outfit-body">
        <div className="outfit-top">
          <span className="outfit-name">{outfit.name}</span>
          <span className="outfit-badge">{outfit.occasion}</span>
        </div>
        <p className="outfit-why">{outfit.why}</p>
        <div className="outfit-color-chips">
          {outfit.colours.map((c, i) => (
            <div key={i} className="outfit-color-chip" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type Screen =
  | "home"
  | "step1" | "step2" | "step3" | "step4" | "loading" | "result"
  | "match-skin" | "match-upload" | "match-loading" | "match-result";

export default function App() {
  // Style profile state
  const [screen, setScreen]       = useState<Screen>("home");
  const [skinTone, setSkinTone]   = useState("");
  const [bodyShape, setBodyShape] = useState("");
  const [height, setHeight]       = useState("");
  const [occasion, setOccasion]   = useState("");
  const [result, setResult]       = useState<StyleResult | null>(null);
  const [error, setError]         = useState("");

  // Match My Clothes state
  const [matchSkinTone, setMatchSkinTone]       = useState("");
  const [matchImageBase64, setMatchImageBase64] = useState("");
  const [matchMimeType, setMatchMimeType]       = useState("");
  const [matchPreview, setMatchPreview]         = useState("");
  const [matchResult, setMatchResult]           = useState<MatchResult | null>(null);
  const [matchError, setMatchError]             = useState("");

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSubmit(selectedOccasion: string) {
    setOccasion(selectedOccasion);
    setScreen("loading");
    setError("");
    const profile: StyleProfile = { skinTone, bodyShape, height, occasion: selectedOccasion };
    try {
      const data = await getStyleAdvice(profile);
      setResult(data);
      setScreen("result");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Error: ${msg}`);
      setScreen("step4");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.split(":")[1].split(";")[0];
      setMatchPreview(dataUrl);
      setMatchImageBase64(base64);
      setMatchMimeType(mimeType);
    };
    reader.readAsDataURL(file);
  }

  async function handleMatchSubmit() {
    setScreen("match-loading");
    setMatchError("");
    const skinLabel = SKIN_TONES.find((t) => t.id === matchSkinTone)?.label ?? matchSkinTone;
    try {
      const response = await fetch(`${API_URL}/api/match-clothes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: matchImageBase64,
          mimeType: matchMimeType,
          skinTone: matchSkinTone,
          skinToneLabel: skinLabel,
        }),
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? `Server error ${response.status}`);
      }
      const data = await response.json() as MatchResult;
      setMatchResult(data);
      setScreen("match-result");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMatchError(`Error: ${msg}`);
      setScreen("match-upload");
    }
  }

  function goHome() {
    setSkinTone(""); setBodyShape(""); setHeight(""); setOccasion("");
    setResult(null); setError("");
    setMatchSkinTone(""); setMatchImageBase64(""); setMatchMimeType("");
    setMatchPreview(""); setMatchResult(null); setMatchError("");
    setScreen("home");
  }

  function restartProfile() {
    setSkinTone(""); setBodyShape(""); setHeight(""); setOccasion("");
    setResult(null); setError("");
    setScreen("step1");
  }

  function resetMatch() {
    setMatchImageBase64(""); setMatchMimeType(""); setMatchPreview("");
    setMatchResult(null); setMatchError("");
  }

  // ── Home ──────────────────────────────────────────────────────────────────

  if (screen === "home") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen home-screen">
          <div className="home-hero">
            <h1 className="home-title">Your personal style,<br />decoded.</h1>
            <p className="home-sub">South Asian menswear intelligence — built around your skin tone.</p>
          </div>
          <div className="home-options">
            <button className="home-option" onClick={() => setScreen("step1")}>
              <span className="home-option-icon">◆</span>
              <span className="home-option-title">Get My Style Profile</span>
              <span className="home-option-desc">Answer 4 questions and receive a complete colour palette, outfit combinations, and style rules — built for your skin tone and body shape.</span>
              <span className="home-option-cta">Start the quiz →</span>
            </button>
            <button className="home-option" onClick={() => setScreen("match-skin")}>
              <span className="home-option-icon">✦</span>
              <span className="home-option-title">Match My Clothes</span>
              <span className="home-option-desc">Upload any piece of clothing and instantly discover which colours pair with it and your skin tone — with outfit ideas to match.</span>
              <span className="home-option-cta">Upload a piece →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Style profile steps ───────────────────────────────────────────────────

  if (screen === "step1") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen">
          <StepHeader step={1} title="What is your skin tone?" subtitle="This determines which colours will make you look most alive." />
          <div className="skin-grid">
            {SKIN_TONES.map((t) => (
              <button
                key={t.id}
                className={`skin-option ${skinTone === t.id ? "selected" : ""}`}
                onClick={() => setSkinTone(t.id)}
              >
                <span className="skin-swatch" style={{ background: t.hex }} />
                <span className="skin-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="nav-row">
            <button className="btn-ghost" onClick={goHome}>Back</button>
            <button className="btn-primary" disabled={!skinTone} onClick={() => setScreen("step2")}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "step2") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen">
          <StepHeader step={2} title="What is your body shape?" subtitle="Silhouette is everything. Dress with your shape, not against it." />
          <div className="shape-grid">
            {BODY_SHAPES.map((s) => {
              const Svg = SILHOUETTE_MAP[s.id];
              return (
                <button
                  key={s.id}
                  className={`shape-option ${bodyShape === s.id ? "selected" : ""}`}
                  onClick={() => setBodyShape(s.id)}
                >
                  <div className="shape-svg"><Svg /></div>
                  <span className="shape-label">{s.label}</span>
                  <span className="shape-desc">{s.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="nav-row">
            <button className="btn-ghost" onClick={() => setScreen("step1")}>Back</button>
            <button className="btn-primary" disabled={!bodyShape} onClick={() => setScreen("step3")}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "step3") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen">
          <StepHeader step={3} title="How tall are you?" subtitle="Height changes proportion. Knowing yours unlocks the right cuts." />
          <div className="height-grid">
            {HEIGHTS.map((h) => (
              <button
                key={h.id}
                className={`height-option ${height === h.id ? "selected" : ""}`}
                onClick={() => setHeight(h.id)}
              >
                <span className="height-label">{h.label}</span>
                <span className="height-sub">{h.sub}</span>
              </button>
            ))}
          </div>
          <div className="nav-row">
            <button className="btn-ghost" onClick={() => setScreen("step2")}>Back</button>
            <button className="btn-primary" disabled={!height} onClick={() => setScreen("step4")}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "step4") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen">
          <StepHeader step={4} title="What are you dressing for?" subtitle="Every occasion has a code. Let's crack yours." />
          {error && <p className="error-msg">{error}</p>}
          <div className="occasion-grid">
            {OCCASIONS.map((o) => (
              <button
                key={o.id}
                className={`occasion-option ${occasion === o.id ? "selected" : ""}`}
                onClick={() => setOccasion(o.id)}
              >
                <span className="occasion-icon">{o.icon}</span>
                <span className="occasion-label">{o.label}</span>
              </button>
            ))}
          </div>
          <div className="nav-row">
            <button className="btn-ghost" onClick={() => setScreen("step3")}>Back</button>
            <button
              className="btn-primary"
              disabled={!occasion}
              onClick={() => handleSubmit(occasion)}
            >
              Get My Style Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "loading") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen loading-screen">
          <div className="loading-mark">✦</div>
          <h2 className="loading-title">Crafting your profile</h2>
          <p className="loading-sub">Analysing your skin tone, shape &amp; occasion…</p>
          <div className="loading-bar"><div className="loading-fill" /></div>
        </div>
      </div>
    );
  }

  if (screen === "result" && result) {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen result-screen">

          <div className="profile-header">
            <div className="profile-tag">Your Style Profile</div>
            <h1 className="profile-title">{result.profileTitle}</h1>
            <p className="profile-desc">{result.profileDesc}</p>
            <div className="profile-meta">
              <span>{skinTone}</span>
              <span className="meta-dot">·</span>
              <span>{bodyShape}</span>
              <span className="meta-dot">·</span>
              <span>{height}</span>
              <span className="meta-dot">·</span>
              <span>{occasion}</span>
            </div>
          </div>

          <section className="result-section">
            <h3 className="section-label">Your Colour Palette</h3>
            <Palette swatches={result.palette} />
          </section>

          <section className="result-section">
            <h3 className="section-label">Curated Outfits</h3>
            <div className="outfit-grid">
              {result.outfits.map((o) => <OutfitCard key={o.name} outfit={o} />)}
            </div>
          </section>

          <section className="result-section">
            <h3 className="section-label">Style Rules For You</h3>
            <div className="tips-grid">
              {result.tips.map((tip, i) => (
                <div key={i} className="tip-card">
                  <span className="tip-num">0{i + 1}</span>
                  <p className="tip-text">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="result-section">
            <h3 className="section-label">What To Avoid</h3>
            <ul className="avoid-list">
              {result.avoid.map((a, i) => (
                <li key={i} className="avoid-item">
                  <span className="avoid-x">✕</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="result-footer">
            <button className="btn-ghost" onClick={restartProfile}>Start Over</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Match My Clothes flow ──────────────────────────────────────────────────

  if (screen === "match-skin") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen">
          <StepHeader
            step={1}
            title="First, your skin tone"
            subtitle="So we can personalise the matches to you."
            steps={MATCH_STEPS}
          />
          <div className="skin-grid">
            {SKIN_TONES.map((t) => (
              <button
                key={t.id}
                className={`skin-option ${matchSkinTone === t.id ? "selected" : ""}`}
                onClick={() => setMatchSkinTone(t.id)}
              >
                <span className="skin-swatch" style={{ background: t.hex }} />
                <span className="skin-label">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="nav-row">
            <button className="btn-ghost" onClick={goHome}>Back</button>
            <button className="btn-primary" disabled={!matchSkinTone} onClick={() => setScreen("match-upload")}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "match-upload") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen">
          <StepHeader
            step={2}
            title="Upload your clothing item"
            subtitle="A shirt, jeans, jacket — any single piece."
            steps={MATCH_STEPS}
          />
          {matchError && <p className="error-msg">{matchError}</p>}
          <div className="upload-area">
            <label className={`upload-box ${matchPreview ? "has-preview" : ""}`} htmlFor="clothing-upload">
              {matchPreview ? (
                <img src={matchPreview} className="upload-preview" alt="Your clothing item" />
              ) : (
                <>
                  <span className="upload-icon">↑</span>
                  <span className="upload-label">Click to upload</span>
                  <span className="upload-hint">JPG · PNG · WEBP</span>
                </>
              )}
            </label>
            <input
              id="clothing-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="upload-input"
              onChange={handleFileChange}
            />
            {matchPreview && (
              <button
                className="upload-change"
                onClick={() => { setMatchPreview(""); setMatchImageBase64(""); setMatchMimeType(""); }}
              >
                Choose a different image
              </button>
            )}
          </div>
          <div className="nav-row">
            <button className="btn-ghost" onClick={() => setScreen("match-skin")}>Back</button>
            <button className="btn-primary" disabled={!matchImageBase64} onClick={handleMatchSubmit}>
              Find Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "match-loading") {
    return (
      <div className="app">
        <AppHeader />
        <div className="screen loading-screen">
          <div className="loading-mark">✦</div>
          <h2 className="loading-title">Reading your colour</h2>
          <p className="loading-sub">Analysing the item and finding your perfect matches…</p>
          <div className="loading-bar"><div className="loading-fill" /></div>
        </div>
      </div>
    );
  }

  if (screen === "match-result" && matchResult) {
    const skinLabel = SKIN_TONES.find((t) => t.id === matchSkinTone)?.label ?? matchSkinTone;
    return (
      <div className="app">
        <AppHeader />
        <div className="screen result-screen">

          <div className="profile-header">
            <div className="profile-tag">Colour Match</div>
            <h1 className="profile-title">{matchResult.item}</h1>
            <div className="match-item-row">
              <div className="match-item-swatch" style={{ background: matchResult.itemHex }} />
              <span className="match-item-colour">{matchResult.itemColour}</span>
            </div>
            <div className="profile-meta">
              <span>{skinLabel} skin tone</span>
            </div>
          </div>

          <section className="result-section">
            <h3 className="section-label">Perfect matches for your skin tone</h3>
            <div className="match-swatches">
              {matchResult.matches.map((m) => (
                <div key={m.hex} className="match-swatch-card">
                  <div className="match-swatch-block" style={{ background: m.hex }} />
                  <span className="match-swatch-name">{m.name}</span>
                  <span className="match-swatch-pantone">{m.pantone}</span>
                  <span className="match-swatch-realworld">"{m.realWorldRef}"</span>
                  <p className="match-swatch-reason">{m.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="result-section">
            <h3 className="section-label">Outfit combinations</h3>
            <div className="outfit-grid">
              {matchResult.outfits.map((o) => <MatchOutfitCard key={o.name} outfit={o} />)}
            </div>
          </section>

          <section className="result-section">
            <h3 className="section-label">Colours to avoid</h3>
            <ul className="avoid-list">
              {matchResult.avoid.map((a) => (
                <li key={a.hex} className="avoid-item match-avoid-item">
                  <div className="match-avoid-swatch" style={{ background: a.hex }} />
                  <div className="match-avoid-text">
                    <strong className="match-avoid-colour">{a.colour}</strong>
                    <span className="match-avoid-reason"> — {a.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="result-footer result-footer--split">
            <button className="btn-ghost" onClick={goHome}>Back to Home</button>
            <button className="btn-primary" onClick={() => { resetMatch(); setScreen("match-upload"); }}>
              Try Another Piece
            </button>
          </div>

        </div>
      </div>
    );
  }

  return null;
}

function AppHeader() {
  return (
    <header className="app-header">
      <span className="header-mark">✦</span>
      <span className="header-title">StyleCode</span>
    </header>
  );
}
