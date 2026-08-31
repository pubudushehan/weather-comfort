# Formula V2 — Live Coding Reference Guide

**Purpose:** Step-by-step reference for re-implementing the V2 Comfort Index formula
(visibility added at 10% weight) from scratch in a live recording session.

> After you verify this works, you will delete the code and re-implement it using this guide.

---

## What V2 Changes

| Component | V1 Weight | V2 Weight |
|---|---|---|
| Temperature | 40% | **35%** |
| Humidity | 25% | **20%** |
| Wind Speed | 20% | 20% |
| Cloudiness | 15% | 15% |
| **Visibility** | — | **10%** (new) |
| **Total** | **100%** | **100%** |

**Visibility = None rule:** When OpenWeatherMap does not return visibility data,
the score defaults to **70.0** (neutral — "decent visibility assumed").
This prevents unfairly penalizing cities with missing data.

---

## Implementation Order

```
Step 1 → backend/app/models/weather.py                      (add the field to the data model)
Step 2 → backend/app/services/comfort_service.py             (add the scorer + update formula)
Step 3 → backend/app/services/weather_service.py             (wire visibility_m + bump version)
Step 4 → backend/tests/test_comfort_index.py                 (add one import + one test function)
Step 5 → frontend/lib/api-codegen/models/ScoreBreakdown.ts   (sync TS type)
Step 6 → frontend/components/score-breakdown.tsx             (render visibility bar in UI)
Step 7 → frontend/app/page.tsx                              (add visibility to mock data)
Step 8 → Run the new test only
```

> **Note on existing tests:** The existing tests in `test_comfort_index.py` have hardcoded
> `total_score` values that will fail with V2 weights (weights shifted from 40/25/20/15
> to 35/20/20/15/10). Do NOT run the full file during the recording.
> Run only the new function by name — see Step 8.

---

## Step 1 — `backend/app/models/weather.py`

**🎙 Voiceover:**
> *"I'll start with the data model — the Pydantic schema. I need to add a visibility field
> to ScoreBreakdown first, because if I write the scorer before the model has the field,
> Python will throw a ValidationError when I try to build the breakdown object."*

**Before (V1):**
```python
from pydantic import BaseModel, Field

class ScoreBreakdown(BaseModel):
    temperature: float = Field(..., description="Comfort score component for temperature (0-100)")
    humidity: float = Field(..., description="Comfort score component for humidity (0-100)")
    wind: float = Field(..., description="Comfort score component for wind speed (0-100)")
    cloudiness: float = Field(..., description="Comfort score component for cloudiness (0-100)")
```

**After (V2) — two changes:**
```python
from pydantic import BaseModel, Field
from typing import Optional               # ← ADD THIS LINE

class ScoreBreakdown(BaseModel):
    temperature: float = Field(..., description="Comfort score component for temperature (0-100)")
    humidity: float = Field(..., description="Comfort score component for humidity (0-100)")
    wind: float = Field(..., description="Comfort score component for wind speed (0-100)")
    cloudiness: float = Field(..., description="Comfort score component for cloudiness (0-100)")
    visibility: Optional[float] = Field(None, description="Comfort score component for visibility (0-100)")  # ← ADD THIS LINE
```

**🎙 While typing:**
> *"Optional[float] means this field can hold a number or None. Field(None) sets the default
> to None — so this is backward-compatible. Old API responses without visibility still parse correctly."*

---

## Step 2 — `backend/app/services/comfort_service.py`

**🎙 Voiceover:**
> *"Now the formula itself. I need to add the visibility scorer function and update
> calculate_comfort_index to include it with a 10% weight. I'm also rebalancing
> the other weights so they still sum to 100%."*

### 2a — Add `Optional` import at the top

**Before:**
```python
from pydantic import BaseModel
from app.models.weather import ScoreBreakdown
```

**After:**
```python
from pydantic import BaseModel
from typing import Optional              # ← ADD THIS LINE
from app.models.weather import ScoreBreakdown
```

**🎙 While typing:**
> *"I need Optional from typing for the visibility_m parameter type hint."*

### 2b — Add `calculate_visibility_score()` after `calculate_cloudiness_score()`

Insert this new function after the `calculate_cloudiness_score` function (around line 30):

```python
def calculate_visibility_score(visibility_m: int | None) -> float:
    if visibility_m is None:
        return 70.0

    visibility_km = visibility_m / 1000

    if visibility_km >= 8:
        return 100.0

    return max(0.0, (visibility_km / 8) * 100)
```

**🎙 While typing:**
> *"The formula is simple and linear. OpenWeatherMap returns visibility in meters,
> so I divide by 1000 to get kilometers. Anything above 8 km is considered perfect visibility
> and scores 100. Below that it scales proportionally — 4 km gets 50, 2 km gets 25.
> If the provider doesn't return visibility at all, I default to 70, which is a neutral
> 'decent visibility assumed' value so we don't unfairly penalize cities with missing data."*

**How the linear formula works:**

| Condition | Score | Real-world meaning |
|---|---|---|
| `visibility_m is None` | 70.0 | Data unavailable → neutral default |
| `>= 8 km (8000 m)` | 100.0 | Excellent visibility — full score |
| `< 8 km` | proportional | `(km / 8) × 100` — smoothly decreases toward 0 |

### 2c — Update `calculate_comfort_index()` — three edits

**Before (V1 signature):**
```python
def calculate_comfort_index(
    temperature_c: float,
    humidity: float,
    wind_speed_mps: float,
    cloudiness_percent: float
) -> ComfortIndexResult:
    """
    Calculate overall Comfort Index Score and component breakdown.
    Version 1 Weights:
    - Temperature: 0.40
    - Humidity: 0.25
    - Wind Speed: 0.20
    - Cloudiness: 0.15
    """
    temp_score = calculate_temperature_score(temperature_c)
    humidity_score = calculate_humidity_score(humidity)
    wind_score = calculate_wind_score(wind_speed_mps)
    clouds_score = calculate_cloudiness_score(cloudiness_percent)

    # Round component scores to 2 decimal places
    temp_score = round(min(100.0, max(0.0, temp_score)), 2)
    humidity_score = round(min(100.0, max(0.0, humidity_score)), 2)
    wind_score = round(min(100.0, max(0.0, wind_score)), 2)
    clouds_score = round(min(100.0, max(0.0, clouds_score)), 2)

    total_score = (
        temp_score * 0.40
        + humidity_score * 0.25
        + wind_speed * 0.20
        + clouds_score * 0.15
    )

    total_score = min(100.0, max(0.0, total_score))
    total_score = round(total_score, 2)

    breakdown = ScoreBreakdown(
        temperature=temp_score,
        humidity=humidity_score,
        wind=wind_score,
        cloudiness=clouds_score
    )

    return ComfortIndexResult(
        total_score=total_score,
        score_breakdown=breakdown
    )
```

**After (V2 — annotated with ← comments showing what changed):**
```python
def calculate_comfort_index(
    temperature_c: float,
    humidity: float,
    wind_speed_mps: float,
    cloudiness_percent: float,
    visibility_m: Optional[int] = None          # ← ADD: new optional parameter
) -> ComfortIndexResult:
    """
    Calculate overall Comfort Index Score and component breakdown.
    Version 2 Weights:                          # ← CHANGE: version label
    - Temperature: 0.35                         # ← CHANGE: was 0.40
    - Humidity: 0.20                            # ← CHANGE: was 0.25
    - Wind Speed: 0.20
    - Cloudiness: 0.15
    - Visibility: 0.10                          # ← ADD: new component
    When visibility_m is None, a neutral default score of 70.0 is used.
    """
    temp_score = calculate_temperature_score(temperature_c)
    humidity_score = calculate_humidity_score(humidity)
    wind_score = calculate_wind_score(wind_speed_mps)
    clouds_score = calculate_cloudiness_score(cloudiness_percent)
    visibility_score = calculate_visibility_score(visibility_m)  # ← ADD: call new scorer

    # Round component scores to 2 decimal places
    temp_score = round(min(100.0, max(0.0, temp_score)), 2)
    humidity_score = round(min(100.0, max(0.0, humidity_score)), 2)
    wind_score = round(min(100.0, max(0.0, wind_score)), 2)
    clouds_score = round(min(100.0, max(0.0, clouds_score)), 2)
    visibility_score = round(min(100.0, max(0.0, visibility_score)), 2)  # ← ADD: round visibility too

    total_score = (
        temp_score * 0.35                       # ← CHANGE: was 0.40
        + humidity_score * 0.20                 # ← CHANGE: was 0.25
        + wind_score * 0.20
        + clouds_score * 0.15
        + visibility_score * 0.10               # ← ADD: new weight term
    )

    total_score = min(100.0, max(0.0, total_score))
    total_score = round(total_score, 2)

    breakdown = ScoreBreakdown(
        temperature=temp_score,
        humidity=humidity_score,
        wind=wind_score,
        cloudiness=clouds_score,
        visibility=visibility_score             # ← ADD: pass into breakdown
    )

    return ComfortIndexResult(
        total_score=total_score,
        score_breakdown=breakdown
    )
```

**🎙 While editing the weights:**
> *"I'm rebalancing the weights. Temperature drops from 40 to 35, humidity from 25 to 20.
> Wind and cloudiness stay the same at 20 and 15. The 10% freed up goes entirely to visibility.
> Total is still 100%."*

**🎙 While adding visibility to breakdown:**
> *"And I pass visibility_score into the ScoreBreakdown so it appears in the API response
> and the frontend can render it."*

---

## Step 3 — `backend/app/services/weather_service.py`

**🎙 Voiceover:**
> *"Now I wire it up in the service layer. The visibility_m value is already being extracted
> from the raw JSON a few lines above — I just wasn't passing it into the formula before.
> I also bump the formula version to v2 so the API response tells the frontend which
> formula was used."*

### 3a — Pass `visibility_m` into the function call

Find this block (~line 113):

```python
# Compute index score
calc_result = calculate_comfort_index(
    temperature_c=temp_c,
    humidity=float(humidity),
    wind_speed_mps=wind_speed,
    cloudiness_percent=float(cloudiness),
)
```

Change to:

```python
# Compute index score
calc_result = calculate_comfort_index(
    temperature_c=temp_c,
    humidity=float(humidity),
    wind_speed_mps=wind_speed,
    cloudiness_percent=float(cloudiness),
    visibility_m=visibility_m           # ← ADD THIS LINE
)
```

**🎙 While typing:**
> *"visibility_m is already in scope — it was extracted from the raw JSON earlier to compute
> visibility_km for the display. I'm just reusing it here for the formula. No extra API call needed."*

### 3b — Change `formula_version` to `"v2"`

Find this in `ComfortWeatherResponse(...)` construction (~line 159):

```python
formula_version="v1",
```

Change to:

```python
formula_version="v2",
```

**🎙 While typing:**
> *"And I bump the formula version to v2. This is returned in the API response
> so the dashboard can display which version is currently active."*

---

## Step 4 — `backend/tests/test_comfort_index.py`

**🎙 Voiceover:**
> *"Instead of creating a whole new test file, I'll add one small targeted test
> directly in the existing file. Two changes only — add the import and add the function."*

### 4a — Add `calculate_visibility_score` to the import at the top

**Before:**
```python
from app.services.comfort_service import (
    calculate_comfort_index,
    calculate_temperature_score,
    calculate_humidity_score,
    calculate_wind_score,
    calculate_cloudiness_score,
)
```

**After:**
```python
from app.services.comfort_service import (
    calculate_comfort_index,
    calculate_temperature_score,
    calculate_humidity_score,
    calculate_wind_score,
    calculate_cloudiness_score,
    calculate_visibility_score,     # ← ADD THIS LINE
)
```

**🎙 While typing:**
> *"Just adding the new scorer to the existing import block."*

### 4b — Add one test function at the bottom of the file

```python
# V2 — Visibility scorer boundary test
def test_visibility_score():
    assert calculate_visibility_score(10_000) == 100.0   # 10 km  → perfect
    assert calculate_visibility_score(4_000) == 50.0    # 4 km   → (4/8)*100
    assert calculate_visibility_score(None) == 70.0     # no data → neutral default
    assert calculate_visibility_score(0) == 0.0         # 0 m    → worst case
```

**🎙 While typing:**
> *"Four asserts covering the key cases: perfect visibility, proportional mid-range,
> the None default, and the floor. Fast to type, easy to read."*

---

## Step 5 — `frontend/lib/api-codegen/models/ScoreBreakdown.ts`

**🎙 Voiceover:**
> *"This is the auto-generated TypeScript type for ScoreBreakdown. Normally you'd regenerate
> this by running the codegen command after changing the backend schema, but for this session
> I'll add the field manually so the TypeScript compiler knows about it."*

**Before (V1):**
```typescript
export type ScoreBreakdown = {
    temperature: number;
    humidity: number;
    wind: number;
    cloudiness: number;
};
```

**After (V2) — add the last three lines:**
```typescript
export type ScoreBreakdown = {
    temperature: number;
    humidity: number;
    wind: number;
    cloudiness: number;
    /**
     * Comfort score component for visibility (0-100)
     */
    visibility?: number | null;     // ← ADD: optional, matches Python Optional[float]
};
```

**🎙 While typing:**
> *"The question mark makes it optional — this field might not exist in the object.
> The pipe null means it can also be explicitly set to null. Together these match
> Python's Optional[float] with a default of None."*

---

## Step 6 — `frontend/components/score-breakdown.tsx`

**🎙 Voiceover:**
> *"Now the UI. This component renders the colored progress bars for each score component.
> I just need to add visibility to the items array. I'll use a spread with a conditional
> so it only renders when the value is actually present."*

**Before (V1):**
```tsx
const items = [
  { label: "Temperature", val: breakdown.temperature, color: "bg-orange-500" },
  { label: "Humidity",    val: breakdown.humidity,    color: "bg-blue-500"   },
  { label: "Wind Speed",  val: breakdown.wind,        color: "bg-teal-500"   },
  { label: "Cloudiness",  val: breakdown.cloudiness,  color: "bg-indigo-500" },
];
```

**After (V2):**
```tsx
const items = [
  { label: "Temperature", val: breakdown.temperature, color: "bg-orange-500" },
  { label: "Humidity",    val: breakdown.humidity,    color: "bg-blue-500"   },
  { label: "Wind Speed",  val: breakdown.wind,        color: "bg-teal-500"   },
  { label: "Cloudiness",  val: breakdown.cloudiness,  color: "bg-indigo-500" },
  ...(breakdown.visibility != null                      // ← ADD: spread operator
    ? [{ label: "Visibility", val: breakdown.visibility, color: "bg-violet-500" }]
    : []),
];
```

**🎙 While typing:**
> *"I'm using the spread operator with a ternary here. If visibility is null or undefined,
> the spread returns an empty array and nothing renders. If it's a number, it adds the bar.
> This keeps the component safe against V1 responses that don't have the visibility field at all.
> I chose violet for the color — distinct from the other four and fits the sky theme."*

---

## Step 7 — `frontend/app/page.tsx`

**🎙 Voiceover:**
> *"Last step — the landing page mock data. This is the static demo card shown to non-logged-in
> users. I just need to add visibility to the score_breakdown object so the card renders
> the fifth bar on the landing page too."*

Find the `score_breakdown` object in the `MOCK_CITY` constant (~line 31):

```tsx
// BEFORE (V1):
score_breakdown: {
  temperature: 82.5,
  humidity: 100.0,
  wind: 92.3,
  cloudiness: 100.0,
}

// AFTER (V2):
score_breakdown: {
  temperature: 82.5,
  humidity: 100.0,
  wind: 92.3,
  cloudiness: 100.0,
  visibility: 100.0,    // ← ADD: 100.0 = perfect visibility for demo city
}
```

**🎙 While typing:**
> *"100.0 for the mock — this is the demo card, so it should show ideal conditions
> to give the best first impression on the landing page."*

---

## Quick Reference — All Changed Lines

| File | What Changed |
|---|---|
| `backend/app/models/weather.py` | `from typing import Optional` added; `visibility: Optional[float]` added to `ScoreBreakdown` |
| `backend/app/services/comfort_service.py` | `from typing import Optional` added; `calculate_visibility_score()` function added; `visibility_m` parameter added; weights updated to 35/20/20/15/10; `visibility_score` added to rounding, total, and breakdown |
| `backend/app/services/weather_service.py` | `visibility_m=visibility_m` added to `calculate_comfort_index` call; `formula_version="v2"` |
| `backend/tests/test_comfort_index.py` | `calculate_visibility_score` added to import; `test_visibility_score_is_high_for_clear_visibility` added at bottom |
| `frontend/lib/api-codegen/models/ScoreBreakdown.ts` | `visibility?: number \| null` added |
| `frontend/components/score-breakdown.tsx` | Visibility bar with `bg-violet-500` added using spread+ternary |
| `frontend/app/page.tsx` | `visibility: 100.0` added to mock `score_breakdown` |

---

## Reverting to V1 (when you finish practicing)

To undo all changes and go back to V1, reverse in the opposite order:

```
Step 7 → remove visibility from page.tsx mock data
Step 6 → remove the spread/visibility entry from score-breakdown.tsx items
Step 5 → remove visibility field from ScoreBreakdown.ts
Step 4 → remove test_visibility_score_is_high_for_clear_visibility function
          remove calculate_visibility_score from imports
Step 3 → remove visibility_m=visibility_m, change formula_version back to "v1"
Step 2 → remove calculate_visibility_score(), remove Optional import, restore V1 weights
Step 1 → remove visibility field + Optional import from weather.py
```
