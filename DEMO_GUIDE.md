# ScholarForge: Live Demo & Video Walkthrough Guide

This guide outlines the recommended script for demonstrating ScholarForge during live presentations, conference demos, or recorded video walkthroughs.

---

## 1. Quick Start Demonstration

```bash
# Start backend server
source .venv/bin/activate
uvicorn app.main:app --port 8000
```
Open **`http://localhost:8000`** in Google Chrome or Firefox.

---

## 2. Walkthrough Script

### Scene 1: High Overlap Detection & Topic Uniqueness (Agent 1)
1. In the **Topic Uniqueness** tab, click **"Transformer (High Overlap)"** preset.
2. Notice the Overlap Threshold is set to `0.75`.
3. Click **"Compute Topic Uniqueness"**.
4. **Observable UI Behavior**:
   - The Overlap Meter bar animates to **~78.5%** in bright rose.
   - Uniqueness score displays **21.5 / 100**.
   - A prominent **"High Overlap Warning"** badge appears.
   - **8 Overlapping Paper Cards** appear with exact citation counts (e.g. *Vaswani et al., 125,000 citations*).
   - Each card displays a **grounded 1-line reason** for the overlap.
   - An **Actionable Differentiation Strategies** panel provides 3 specific ways to contrast the work.
   - The **Coverage Caveat** banner is displayed explaining retrieval recall limits (Recall@20 ~0.66).

### Scene 2: Novel Topic & Calibrated Rating (Agent 1 & Calibration)
1. Click **"Novel Bio Topic"** preset (*Cryogenic Enzymatic Synthesis of Bio-Degradable Superconductors*).
2. Click **"Compute Topic Uniqueness"**.
3. **Observable UI Behavior**:
   - The Overlap Meter shows low overlap in emerald green.
   - The Uniqueness score is high.
   - The **RINoBench Calibrated Novelty Rating** displays **~3.5 - 4.5 / 5.0 stars**.
   - Exactly the top 3 closest papers are displayed without alarm.

### Scene 3: Grounded Academic Section Drafting (Agent 4)
1. Switch to the **Writing & Grounding** tab at the top.
2. Select section: `Introduction` or `Related Work`.
3. Click **"Draft Selected Section"**.
4. **Observable UI Behavior**:
   - **Stage 1**: Generates intermediate structured JSON showing explicit scientific claims and cited paper keys.
   - **Stage 2**: Translates into grounded academic LaTeX paragraphs with valid `\cite{...}` tags.
5. Click **"Condense to Length Budget"** to show the LLM rewriter condensing the draft by 30% without dropping empirical facts.

### Scene 4: Multi-Venue Formatting & Constraints Checking (Agents 6 & 7)
1. Switch to the **Multi-Venue Export** tab.
2. Select venue: **`IEEE Conference (6 pages, 2-column)`**.
3. Click **"Run Constraints Checker"**:
   - Shows real-time validation of Word Count, Abstract Limit, and Keywords.
   - Displays compliance badge.
4. Now select **`ACL / EMNLP / NAACL (8 pages, double-blind)`**:
   - Uncheck "Double-Blind Anonymization" to show the constraints checker immediately catching the violation:
     *"ACL requires double-blind anonymization for initial review."*
   - Re-check the box to see the violation clear!
5. Click **"Compile & Download PDF"** and **"Export to DOCX (Word)"**:
   - Downloads fully styled documents ready for submission.

---

## 3. Terminal Demonstration: Metric Reproduction

Show the audience how every number in the README is reproduced from a single command:

```bash
python experiments/run_all.py
```
*Outputs LitSearch Recall@5 and Recall@20, ACLSum ROUGE-L, research-plan-gen paired bootstrap CI, and RINoBench calibration stats in under 1 second!*
