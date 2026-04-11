/* ============================
   Sample Data
   ============================ */

const CLASSES_DATA = {
  S129: {
    homework: [
      {
        date: "[HW Day 03] 04/12",
        parts: [
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            content: {
              passage: "Thank you for joining the number one source for your local weather forecast. It seems like Richmond will be having a rainy weekend. Make sure to gear up with an umbrella, a rain coat or rainboots when going outdoors this weekend. Stay tuned for sports news after hearing a word from our sponsor."
            }
          },
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            content: {
              passage: "Ladies and gentlemen, welcome to the grand opening of The Taco Joint. We started off as a food truck in Fresno in 2011. Thanks to all of you, we now have a store here on the Fifth Street. I just hope that we could provide locals with good food, drinks and snacks for years to come. Make sure to come by The Taco Joint when you feel like having some authentic Mexican food."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "1.png",
              imagePlaceholder: "🖼️ Picture 1",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "2.png",
              imagePlaceholder: "🖼️ Picture 2",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            responseTime: 15,
            content: {
              question: "What was your first ever job how long did you do it for?"
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            responseTime: 15,
            content: {
              question: "Do you prefer to work during the daytime or during the night time? Why?"
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            content: {
              question: "What are some advantages of working in a busy city rather than working in a quiet area?"
            }
          },
          {
            type: "respond-info-q",
            label: "Questions 8-10: Respond to Information",
            questionLabel: "Questions 8-10",
            content: {
              imageUrl: "3.png",
              videoUrl: "https://www.youtube.com/embed/3jmaksYCoxQ?start=618&enablejsapi=1",
              question: "Question 8: What time will the orientation start and end?\n\nQuestion 9: Will I have to bring my own lunch?\n\nQuestion 10: Can you tell me the details of the session that I will be leading?"
            }
          },
          {
            type: "opinion",
            label: "Express an Opinion",
            questionLabel: "Question 11",
            responseTime: 60,
            content: {
              prompt: "Some people think that the company should increase the salary of all the employees every year. Others think that the company should increase the salary of the employees who only bring good results? What is your opinion on this matter."
            }
          }
        ]
      },
      {
        date: "[HW Day 02] 04/11",
        parts: [
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            content: {
              passage: "Good morning, everyone. Thank you for coming to today's meeting. I'd like to start by going over the quarterly sales report. As you can see from the charts, our revenue has increased by fifteen percent compared to the same period last year. This growth was primarily driven by our new product line, which was launched in January. However, I should also mention that our expenses have risen slightly due to increased marketing costs."
            }
          },
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            content: {
              passage: "Attention all passengers. Due to scheduled maintenance work, the express train to Central Station will be delayed by approximately twenty minutes. We apologize for any inconvenience this may cause. Passengers traveling to the downtown area may wish to consider taking the local bus service, which departs from Platform B every ten minutes. Thank you for your patience and understanding."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "",
              imagePlaceholder: "🏢 Office meeting scene",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "opinion",
            label: "Express an Opinion",
            content: {
              prompt: "Do you agree or disagree with the following statement? Companies should allow employees to work from home at least two days a week. Give specific reasons and examples to support your opinion."
            }
          }
        ]
      },
      {
        date: "[HW Day 01] 04/08",
        parts: [
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            content: {
              passage: "Welcome to the grand opening of our newest branch location. We're thrilled to bring our services closer to the residents of this wonderful community. To celebrate, we're offering special opening week discounts of up to thirty percent on all products. Please feel free to explore our store and don't hesitate to ask any of our friendly staff members if you need assistance."
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            content: {
              question: "Imagine that a marketing firm is doing research in your area. You have agreed to participate in a telephone interview about shopping habits.\n\nQuestion: How often do you go shopping, and where do you usually shop?"
            }
          },
          {
            type: "opinion",
            label: "Express an Opinion",
            content: {
              prompt: "Some people prefer to shop at large department stores, while others prefer small local shops. Which do you prefer and why? Use specific reasons and details to support your answer."
            }
          }
        ]
      }
    ],
    lesson: [
      {
        date: "[Lesson Day 02] 04/10",
        vocab: [
          { word: "revenue", definition: "(n.) income, especially of a company", example: "The company's annual revenue exceeded $5 million." },
          { word: "approximately", definition: "(adv.) close to; around", example: "The project will take approximately three weeks." },
          { word: "inconvenience", definition: "(n.) trouble or difficulty", example: "We apologize for any inconvenience caused by the delay." },
          { word: "quarterly", definition: "(adj.) happening every three months", example: "The quarterly report showed strong growth." }
        ],
        structures: [
          { pattern: "Due to + noun/gerund", example: "Due to the heavy rain, the event was postponed.\nDue to increasing demand, we hired more staff." },
          { pattern: "I'd like to + verb", example: "I'd like to start by introducing our new team member.\nI'd like to discuss the upcoming schedule changes." }
        ]
      },
      {
        date: "[Lesson Day 01] 04/07",
        vocab: [
          { word: "hesitate", definition: "(v.) to pause before doing something", example: "Don't hesitate to contact us if you have questions." },
          { word: "thrill", definition: "(v.) to feel very excited", example: "We were thrilled to hear the good news." },
          { word: "assistance", definition: "(n.) help or support", example: "Please ask for assistance if you need help." }
        ],
        structures: [
          { pattern: "feel free to + verb", example: "Feel free to ask any questions during the presentation.\nFeel free to contact me anytime." },
          { pattern: "In my opinion / From my point of view", example: "In my opinion, working from home increases productivity.\nFrom my point of view, this is the best approach." }
        ]
      }
    ]
  },
  S128: {
    homework: [
      {
        date: "[HW Day 01] 04/10",
        parts: [
          {
            type: "email-response",
            label: "Respond to a Written Request",
            content: {
              from: "Sarah Johnson, HR Department",
              to: "All Employees",
              subject: "Annual Company Picnic",
              body: "Dear Team,\n\nWe are planning the annual company picnic for next month. Please let us know your preferred date (June 15 or June 22), any dietary restrictions, and whether you will bring family members.",
              instruction: "Respond to the email. In your response, answer ALL of the questions asked."
            }
          },
          {
            type: "opinion",
            label: "Write an Opinion Essay",
            content: {
              prompt: "Do you agree or disagree with the following statement?\n\n\"Technology has made people's lives more complicated rather than simpler.\"\n\nSupport your opinion with reasons and examples."
            }
          }
        ]
      }
    ],
    lesson: [
      {
        date: "[Lesson Day 01] 04/09",
        vocab: [
          { word: "dietary", definition: "(adj.) relating to diet or food", example: "Please inform us of any dietary restrictions." },
          { word: "complicated", definition: "(adj.) consisting of many connected parts; complex", example: "The instructions were too complicated to follow." },
          { word: "restriction", definition: "(n.) a limiting condition or rule", example: "There are no restrictions on the number of guests." }
        ],
        structures: [
          { pattern: "I would like to + verb", example: "I would like to attend the company picnic.\nI would like to suggest June 22 as the date." },
          { pattern: "In addition / Furthermore / Moreover", example: "The hotel has a pool. In addition, there is a gym.\nThe product is affordable. Furthermore, it is high quality." }
        ]
      }
    ]
  }
};
