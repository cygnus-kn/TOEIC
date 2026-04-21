# How to Add Homework

This guide explains how to add a new homework day for **any class**.
Read the user's prompt to determine: the **class ID**, the **test type** (Speaking or Writing), and the **content** for each question.

---

## 1. Where to Add It

Adding homework requires updating **two** files: `data.js` for the sidebar menu navigation, and `data/CLASS_ID.json` for the actual payload content.

### Step 1: Update `data.js`
Open `data.js`. Find the class entry by its ID inside `CLASSES_DATA` and insert a new pointer object with just the `date` at the top of the `homework` array:

```js
const CLASSES_DATA = {
  CLASS_ID: {
    homework: [
      { date: "[HW Day XX] MM/DD" }, // ← INSERT NEW POINTER HERE (newest first)
      // ... older entries
    ],
    lesson: [ ... ]
  }
}
```

> If the class ID does not exist yet, create a new entry following the shape of an existing one.

### Step 2: Update `data/CLASS_ID.json`
Open the corresponding JSON file in the `data/` folder (e.g., `data/S129.json`). If it doesn't exist, create it. Insert the new homework entry with its full `parts` array at the top of the `homework` array. 
**Important:** Because this is a `.json` file, you MUST use strict JSON formatting (double quotes for all property keys and string values).

```json
{
  "homework": [
    {
      "date": "[HW Day XX] MM/DD",
      "parts": [
        // ← INSERT CONTENT PARTS HERE
      ]
    }
  ],
  "lesson": [ ... ]
}
```

---

## 2. Date Format

```js
date: "[HW Day XX] MM/DD"
```

Example: `"[HW Day 05] 04/15"`

---

## 3. Test Types & Flexibility

TOEIC homework usually follows one of two formats. However, **homework days are flexible**: you can provide partial sets (e.g., just Q1–2), mixed Speaking and Writing tasks, or even just a single part.

| test format  | standard Full Day | Question Numbers             |
| ------------ | ----------------- | ---------------------------- |
| **Speaking** | 9 parts           | Q1–2, Q3–4, Q5–7, Q8–10, Q11 |
| **Writing**  | 8 parts           | Q1–5, Q6–7, Q8               |

---

## ══════════════════════════
## SPEAKING HOMEWORK

A standard speaking session typically follows this order, but can be customized with any number of parts (e.g., just Part 1 or a mix of Parts 1-4):

| #   | Type                | Label                                  | questionLabel      | responseTime    |
| --- | ------------------- | -------------------------------------- | ------------------ | --------------- |
| 1   | `read-aloud`        | Read a Text Aloud                      | `"Questions 1-2"`  | —               |
| 2   | `read-aloud`        | Read a Text Aloud                      | `"Questions 1-2"`  | —               |
| 3   | `describe-picture`  | Describe a Picture                     | —                  | —               |
| 4   | `describe-picture`  | Describe a Picture                     | —                  | —               |
| 5   | `respond-questions` | Respond to Questions                   | `"Questions 5-7"`  | `15`            |
| 6   | `respond-questions` | Respond to Questions                   | `"Questions 5-7"`  | `15`            |
| 7   | `respond-questions` | Respond to Questions                   | `"Questions 5-7"`  | `30`            |
| 8   | `respond-info-q`    | Questions 8-10: Respond to Information | `"Questions 8-10"` | —               |
| 9   | `opinion`           | Express an Opinion                     | `"Question 11"`    | `60` (optional) |

---

### Speaking Part Schemas

#### `read-aloud`
```js
{
  type: "read-aloud",
  label: "Read a Text Aloud",
  questionLabel: "Questions 1-2",
  content: {
    passage: "Full passage text here."
  }
}
```

#### `describe-picture`
```js
{
  type: "describe-picture",
  label: "Describe a Picture",
  content: {
    imageUrl: "test-data/speaking-pictures/FILENAME.png",  // path relative to project root
    imagePlaceholder: "🖼️ Picture 1",            // fallback label if image missing
    prompt: "Describe the picture in as much detail as you can."
  }
}
```

#### `respond-questions`
```js
// Parts 5 & 6 — short answer
{
  type: "respond-questions",
  label: "Respond to Questions",
  questionLabel: "Questions 5-7",
  responseTime: 15,
  content: { question: "Question text here." }
}

// Part 7 — longer answer, may have bullet options
{
  type: "respond-questions",
  label: "Respond to Questions",
  questionLabel: "Questions 5-7",
  responseTime: 30,
  content: {
    question: "Which of the following do you prefer?\n- Option A\n- Option B\n- Option C"
  }
}
```
> Use `\n- ` to create bullet list items. They render as `<ul><li>` in the app.

> [!IMPORTANT]
> Q5-7 questions in the workbook are often preceded by an intro scenario (e.g. *"Imagine that a company is doing research..."*). **Always remove this intro sentence.** Only include the actual question text itself in the `question` field.

#### `respond-info-q`
```js
{
  type: "respond-info-q",
  label: "Questions 8-10: Respond to Information",
  questionLabel: "Questions 8-10",
  content: {
    imageUrl: "test-data/speaking-pictures/FILENAME.png",
    videoUrl: "https://www.youtube.com/embed/VIDEO_ID?start=SECONDS&enablejsapi=1",
    timestamps: {
      q8: 120, // Replace these with exact extracted seconds
      q9: 135,
      q10: 150
    },
    question: "Question 8: ...\n\nQuestion 9: ...\n\nQuestion 10: ..."
  }
}
```
> **Note for AI Assistant: Automated Transcript Extraction Guide**
> When asked to construct a homework prompt containing Part 4 from a YouTube link, follow these exact steps to extract timestamps and scenarios:
> 1. Run this exact terminal command to download the transcript JSON (replace `<VIDEO_ID>`):
>    `/Users/cygnus/Library/Python/3.9/bin/youtube_transcript_api <VIDEO_ID> > transcript.json`
> 2. Read the `transcript.json` using the `grep_search` or `view_file` tool to find the exact timestamps and scenario phrasing for questions 8, 9, and 10.
>    - **CRITICAL FORMATTING RULE**: For Question 8, the `timestamp` MUST map to the very beginning of the caller's overarching scenario introduction (e.g. "Hello my name is..."), NOT just the specific moment they ask Q8!
> 3. Inject the `timestamps` property into your JSON construction.
> 4. In the `question` string, ensure you include any contextual scenario/intro spoken by the speaker immediately *before* the specific questions themselves (e.g. for Q9 or Q10). However, DO NOT include the general overarching introduction to the call (e.g. "Hello my name is...") in the reveal text string. Only include the exact text for Q8, Q9, and Q10.
> 5. **CRITICAL:** Run `rm -f transcript.json` to delete your temporary file once you are finished.
```js
{
  type: "opinion",
  label: "Express an Opinion",
  questionLabel: "Question 11",
  responseTime: 60,  // optional
  content: {
    prompt: "Opinion question goes here."
  }
}
```

---

### Full Speaking Day Template

```js
{
  date: "[HW Day XX] MM/DD",
  parts: [
    {
      type: "read-aloud",
      label: "Read a Text Aloud",
      questionLabel: "Questions 1-2",
      content: { passage: "PASSAGE 1" }
    },
    {
      type: "read-aloud",
      label: "Read a Text Aloud",
      questionLabel: "Questions 1-2",
      content: { passage: "PASSAGE 2" }
    },
    {
      type: "describe-picture",
      label: "Describe a Picture",
      content: {
        imageUrl: "test-data/speaking-pictures/FILENAME-picture-1.png",
        imagePlaceholder: "🖼️ Picture 1",
        prompt: "Describe the picture in as much detail as you can."
      }
    },
    {
      type: "describe-picture",
      label: "Describe a Picture",
      content: {
        imageUrl: "test-data/speaking-pictures/FILENAME-picture-2.png",
        imagePlaceholder: "🖼️ Picture 2",
        prompt: "Describe the picture in as much detail as you can."
      }
    },
    {
      type: "respond-questions",
      label: "Respond to Questions",
      questionLabel: "Questions 5-7",
      responseTime: 15,
      content: { question: "Q5 TEXT" }
    },
    {
      type: "respond-questions",
      label: "Respond to Questions",
      questionLabel: "Questions 5-7",
      responseTime: 15,
      content: { question: "Q6 TEXT" }
    },
    {
      type: "respond-questions",
      label: "Respond to Questions",
      questionLabel: "Questions 5-7",
      responseTime: 30,
      content: { question: "Q7 TEXT\n- Option A\n- Option B\n- Option C" }
    },
    {
      type: "respond-info-q",
      label: "Questions 8-10: Respond to Information",
      questionLabel: "Questions 8-10",
      content: {
        imageUrl: "test-data/speaking-pictures/FILENAME-picture-3.png",
        videoUrl: "https://www.youtube.com/embed/VIDEO_ID?start=SECONDS&enablejsapi=1",
        timestamps: {
          q8: 120, // Replace these with exact extracted seconds
          q9: 135,
          q10: 150
        },
        question: "Question 8: ...\n\nQuestion 9: ...\n\nQuestion 10: ..."
      }
    },
    {
      type: "opinion",
      label: "Express an Opinion",
      questionLabel: "Question 11",
      responseTime: 60,
      content: { prompt: "Q11 OPINION PROMPT" }
    }
  ]
}
```

---

## ══════════════════════════
## TOPIC PREPARATION HOMEWORK

`topic-prep` is a special homework type for **next-session preparation**. Unlike Speaking/Writing tasks, students don't speak or write — they simply think through their answers before the next class. It can be added to **any homework day** — Speaking or Writing — and can sit alongside any part type, including Q11 (Express an Opinion) and the Writing essay (Q8).

**How it renders:** One pagination slot containing a vertical stack of full cards — one card per question — each with its own 30-second preparation timer. The header bar shows **"Topic Preparation"** and **"Question N"**.

| Field           | Required | Description                                                    |
| --------------- | -------- | -------------------------------------------------------------- |
| `type`          | ✅        | Must be `"topic-prep"`                                         |
| `label`         | ✅        | `"Topic Preparation"`                                          |
| `questionLabel` | ✅        | e.g. `"Next Session"` (shown in the pagination dot tooltip)    |
| `topic`         | ✅        | Short topic name, e.g. `"Work & Career"`                       |
| `instruction`   | optional | Italic hint shown at the top of the card stack                 |
| `questions`     | ✅        | Array of question strings (3–7 recommended)                    |
| `responseTime`  | optional | Seconds per question timer. Defaults to `30`. **Set this to match the actual response time of the part being prepared** (see table below) |

**Recommended `responseTime` by preparation type:**

| Preparing for…              | `responseTime` |
| --------------------------- | -------------- |
| Speaking Q5–6 (short)       | `15`           |
| Speaking Q7 / general topic | `30`           |
| Speaking Q11 (opinion)      | `60`           |
| Writing essay (Q8)          | `60` or more   |


### Schema

```json
{
  "type": "topic-prep",
  "label": "Topic Preparation",
  "questionLabel": "Next Session",
  "topic": "TOPIC NAME",
  "instruction": "Think about your answers to the following questions. You will discuss these topics in the next class. Take 30 seconds to prepare each one.",
  "questions": [
    "Question 1 text here.",
    "Question 2 text here.",
    "Question 3 text here.",
    "Question 4 text here.",
    "Question 5 text here."
  ],
  "responseTime": 30
}
```

> [!IMPORTANT]
> **`topic-prep` is always a single entry in the `parts` array**, regardless of how many questions it contains. Do NOT create one entry per question — the app automatically expands the `questions` array into individual stacked cards.

> [!TIP]
> `topic-prep` can appear **anywhere** in the `parts` array — at the end, middle, or beginning of a homework day. The number of questions is flexible; **3–7 is a reasonable range**, but any count works.

### Example — Work & Career

```json
{
  "type": "topic-prep",
  "label": "Topic Preparation",
  "questionLabel": "Next Session",
  "topic": "Work & Career",
  "instruction": "Think about your answers to the following questions. You will discuss these topics in the next class. Take 30 seconds to prepare each one.",
  "questions": [
    "Describe your ideal job. What kind of work environment would you prefer — an office, working from home, or outdoors? Why?",
    "What skills do you think are most important to succeed in today's job market? Give examples.",
    "Have you ever had a part-time job or helped with work at home? What did you learn from that experience?",
    "Some people choose a job for the salary, while others choose based on passion. Which do you think is more important, and why?",
    "How do you think technology is changing the way people work? Give one example of a job that has changed because of technology."
  ],
  "responseTime": 30
}
```

---

## ══════════════════════════
## WRITING HOMEWORK

A standard writing session typically follows this order (individual parts or mixed sets are also allowed):

| #   | Type               | Label                               | questionLabel     | responseTime |
| --- | ------------------ | ----------------------------------- | ----------------- | ------------ |
| 1–5 | `sentence-picture` | Write a Sentence Based on a Picture | `"Questions 1-5"` | —            |
| 6–7 | `email-response`   | Respond to a Written Request        | `"Questions 6-7"` | —            |
| 8   | `opinion`          | Write an Opinion Essay              | `"Question 8"`    | `1800`       |

---

### Writing Part Schemas

#### `sentence-picture` (×5, one per picture/word pair)
```js
{
  type: "sentence-picture",
  label: "Write a Sentence Based on a Picture",
  questionLabel: "Questions 1-5",
  content: {
    imageUrl: "test-data/writing-pictures/FILENAME.jpg",  // path relative to project root
    words: ["word1", "word2"]                              // two words students must use
  }
}
```
> No `responseTime`. No timer is shown for this type.

#### `email-response` (×2, one per email prompt)
```js
{
  type: "email-response",
  label: "Respond to a Written Request",
  questionLabel: "Questions 6-7",
  content: {
    from: "Sender Name",
    to: "Recipient",
    subject: "Subject Line",
    sent: "Month DDth, H:MM A.M./P.M.",   // e.g. "March 17th, 2:10 P.M."
    body: "Full email body text.",
    instruction: "Respond to the e-mail as if you are X. In your e-mail, do Y and Z."
  }
}
```
> All metadata fields (`from`, `to`, `subject`, `sent`) are optional. Only include the fields that are provided in the test prompt.  
> `instruction` renders below the email with a bold **"Direction:"** prefix automatically.

#### `opinion` (Writing)
```js
{
  type: "opinion",
  label: "Write an Opinion Essay",
  questionLabel: "Question 8",
  responseTime: 1800,   // 30 minutes
  content: {
    prompt: "Essay topic/question here."
  }
}
```
> The app automatically prepends a bold **"Essay:"** label when the `label` is `"Write an Opinion Essay"`.  
> **Never add "Essay:" manually to the `prompt` text.** For Speaking Q11 (`"Express an Opinion"`), no label is shown.

---

### Full Writing Day Template

```js
{
  date: "[HW Day XX] MM/DD",
  parts: [
    {
      type: "sentence-picture",
      label: "Write a Sentence Based on a Picture",
      questionLabel: "Questions 1-5",
      content: { imageUrl: "test-data/writing-pictures/FILENAME-pic-1.jpg", words: ["word1", "word2"] }
    },
    {
      type: "sentence-picture",
      label: "Write a Sentence Based on a Picture",
      questionLabel: "Questions 1-5",
      content: { imageUrl: "test-data/writing-pictures/FILENAME-pic-2.jpg", words: ["word3", "word4"] }
    },
    {
      type: "sentence-picture",
      label: "Write a Sentence Based on a Picture",
      questionLabel: "Questions 1-5",
      content: { imageUrl: "test-data/writing-pictures/FILENAME-pic-3.jpg", words: ["word5", "word6"] }
    },
    {
      type: "sentence-picture",
      label: "Write a Sentence Based on a Picture",
      questionLabel: "Questions 1-5",
      content: { imageUrl: "test-data/writing-pictures/FILENAME-pic-4.jpg", words: ["word7", "word8"] }
    },
    {
      type: "sentence-picture",
      label: "Write a Sentence Based on a Picture",
      questionLabel: "Questions 1-5",
      content: { imageUrl: "test-data/writing-pictures/FILENAME-pic-5.jpg", words: ["word9", "word10"] }
    },
    {
      type: "email-response",
      label: "Respond to a Written Request",
      questionLabel: "Questions 6-7",
      content: {
        from: "SENDER",
        to: "RECIPIENT",
        subject: "SUBJECT",
        sent: "DATE, TIME",
        body: "EMAIL BODY",
        instruction: "Respond to the e-mail as if you are X. In your e-mail, do Y and Z."
      }
    },
    {
      type: "email-response",
      label: "Respond to a Written Request",
      questionLabel: "Questions 6-7",
      content: {
        from: "SENDER",
        to: "RECIPIENT",
        subject: "SUBJECT",
        sent: "DATE, TIME",
        body: "EMAIL BODY",
        instruction: "Respond to the e-mail as if you are X. In your e-mail, ask TWO questions and make ONE request."
      }
    },
    {
      type: "opinion",
      label: "Write an Opinion Essay",
      questionLabel: "Question 8",
      responseTime: 1800,
      content: { prompt: "ESSAY TOPIC" }
    }
  ]
}
```

---

## Quick Reference

| Need                     | Rule                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| Where to insert          | `data.js` for date pointers; `data/CLASS_ID.json` for full text content      |
| New class doesn't exist  | Create a new key in `CLASSES_DATA` and initialize matching `data/CLASS_ID.json` file |
| Image paths — Speaking   | `test-data/speaking-pictures/*.png`                                    |
| Image paths — Writing    | `test-data/writing-pictures/*.jpg`                                      |
| YouTube `start=`         | In seconds: `(minutes × 60) + seconds`                                  |
| `responseTime` unit      | Always in **seconds**                                                   |
| Bullet list in questions | Use `\n- Item` in the question string                                   |
| Speaking opinion label   | `"Express an Opinion"`                                                  |
| Writing opinion label    | `"Write an Opinion Essay"`                                              |
| `topic-prep` placement   | Can appear **anywhere** in the `parts` array                        |
| `topic-prep` questions   | Any count works; one string per array entry — stacked into separate cards |
