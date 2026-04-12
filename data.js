/* ============================
   Sample Data
   ============================ */

const CLASSES_DATA = {
  S129: {
    homework: [
      {
        date: "[HW Day 04] 04/13",
        parts: [
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            questionLabel: "Questions 1-2",
            content: {
              passage: "Thank you for tuning into the Daily Cup of Tea podcast. It’s Friday, and as always, we have invited a special guest on our show to spill the tea on what has happened this week. Please welcome a veteran journalist, a published author and a marketing specialist, Cindy Wagner, who is joining us live at the studio today."
            }
          },
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            questionLabel: "Questions 1-2",
            content: {
              passage: "You are watching the Evening Traffic Updates on Channel Eleven. There has been a crash on Turnpike Avenue near Danes Boulevard causing extreme rush hour traffic. It is reported that a large truck, a sedan and a bus are involved in this accident so it might take a while to clear out the roads. Drivers are advised to take a detour to avoid traffic."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "test-data/speaking-pictures/GwenTV-02-2023-picture-1.png",
              imagePlaceholder: "🖼️ Picture 1",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "test-data/speaking-pictures/GwenTV-02-2023-picture-2.png",
              imagePlaceholder: "🖼️ Picture 2",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            questionLabel: "Questions 5-7",
            responseTime: 15,
            content: {
              question: "When was the last time you visited a new city who did you go there with?"
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            questionLabel: "Questions 5-7",
            responseTime: 15,
            content: {
              question: "When you visit a new city would you prefer to stay at a hotel or find a place where you could stay with your friends and family?"
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            questionLabel: "Questions 5-7",
            responseTime: 30,
            content: {
              question: "Which of the following activities do you think you must try when visiting a new city?\n- Eating at a local restaurant\n- Shopping in the neighborhood\n- Going on a guided tour"
            }
          },
          {
            type: "respond-info-q",
            label: "Questions 8-10: Respond to Information",
            questionLabel: "Questions 8-10",
            content: {
              imageUrl: "test-data/speaking-pictures/GwenTV-02-2023-picture-3.png",
              videoUrl: "https://www.youtube.com/embed/kmHuOysUsyM?start=628&enablejsapi=1",
              question: "Question 8: Where will the interviews take place what time will the first interview start?\n\nQuestion 9: I was told that there are two applicants who are applying for the product manager position. Is that right?\n\nQuestion 10: Can you tell me about the applicants who are applying for the receptionist position?"
            }
          },
          {
            type: "opinion",
            label: "Express an Opinion",
            questionLabel: "Question 11",
            content: {
              prompt: "Do you prefer to keep your old clothes or books that you don't use anymore instead of getting rid of them? Why?"
            }
          }
        ]
      },
      {
        date: "[HW Day 03] 04/12",
        parts: [
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            questionLabel: "Questions 1-2",
            content: {
              passage: "Thank you for joining the number one source for your local weather forecast. It seems like Richmond will be having a rainy weekend. Make sure to gear up with an umbrella, a rain coat or rainboots when going outdoors this weekend. Stay tuned for sports news after hearing a word from our sponsor."
            }
          },
          {
            type: "read-aloud",
            label: "Read a Text Aloud",
            questionLabel: "Questions 1-2",
            content: {
              passage: "Ladies and gentlemen, welcome to the grand opening of The Taco Joint. We started off as a food truck in Fresno in 2011. Thanks to all of you, we now have a store here on the Fifth Street. I just hope that we could provide locals with good food, drinks and snacks for years to come. Make sure to come by The Taco Joint when you feel like having some authentic Mexican food."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "test-data/speaking-pictures/GwenTV-01-2023-picture-1.png",
              imagePlaceholder: "🖼️ Picture 1",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "describe-picture",
            label: "Describe a Picture",
            content: {
              imageUrl: "test-data/speaking-pictures/GwenTV-01-2023-picture-2.png",
              imagePlaceholder: "🖼️ Picture 2",
              prompt: "Describe the picture in as much detail as you can."
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            questionLabel: "Questions 5-7",
            responseTime: 15,
            content: {
              question: "What was your first ever job how long did you do it for?"
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            questionLabel: "Questions 5-7",
            responseTime: 15,
            content: {
              question: "Do you prefer to work during the daytime or during the night time? Why?"
            }
          },
          {
            type: "respond-questions",
            label: "Respond to Questions",
            questionLabel: "Questions 5-7",
            responseTime: 30,
            content: {
              question: "What are some advantages of working in a busy city rather than working in a quiet area?"
            }
          },
          {
            type: "respond-info-q",
            label: "Questions 8-10: Respond to Information",
            questionLabel: "Questions 8-10",
            content: {
              imageUrl: "test-data/speaking-pictures/GwenTV-01-2023-picture-3.png",
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
        date: "[HW Day 03] 04/13",
        parts: [
          {
            type: "sentence-picture",
            label: "Write a Sentence Based on a Picture",
            questionLabel: "Questions 1-5",
            content: {
              imageUrl: "test-data/writing-pictures/test-1-2025-pic-1.jpg",
              words: ["sit", "on"]
            }
          },
          {
            type: "sentence-picture",
            label: "Write a Sentence Based on a Picture",
            questionLabel: "Questions 1-5",
            content: {
              imageUrl: "test-data/writing-pictures/test-1-2025-pic-2.jpg",
              words: ["wind", "hard"]
            }
          },
          {
            type: "sentence-picture",
            label: "Write a Sentence Based on a Picture",
            questionLabel: "Questions 1-5",
            content: {
              imageUrl: "test-data/writing-pictures/test-1-2025-pic-3.jpg",
              words: ["if", "fit"]
            }
          },
          {
            type: "sentence-picture",
            label: "Write a Sentence Based on a Picture",
            questionLabel: "Questions 1-5",
            content: {
              imageUrl: "test-data/writing-pictures/test-1-2025-pic-4.jpg",
              words: ["while", "phone"]
            }
          },
          {
            type: "sentence-picture",
            label: "Write a Sentence Based on a Picture",
            questionLabel: "Questions 1-5",
            content: {
              imageUrl: "test-data/writing-pictures/test-1-2025-pic-05.jpg",
              words: ["box", "heavy"]
            }
          },
          {
            type: "email-response",
            label: "Respond to a Written Request",
            questionLabel: "Questions 6-7",
            content: {
              from: "Sandra Smith",
              to: "White Appliances",
              subject: "Unsatisfactory service",
              sent: "March 17th, 2:10 P.M.",
              body: "I'm writing to complain about the unsatisfactory service I received at your store. Two weeks ago, I purchased a newly launched model of washing machine. But I found when I unpacked it that it had been damaged on the right side of the door. Also, when I was doing my laundry it automatically stopped and I couldn't get it to start again. So, I tried to call the repair center over 5 times, but I still haven't received any repair service. I think this is not a good way to treat customers. Please write back soon and let's discuss this matter.",
              instruction: "Respond to the e-mail as if you are a worker at White Appliances. In your e-mail, give at least ONE explanation and make TWO compensations."
            }
          },
          {
            type: "email-response",
            label: "Respond to a Written Request",
            questionLabel: "Questions 6-7",
            content: {
              from: "Kangaroo Travel Agency",
              to: "Potential traveler",
              subject: "It's time to travel!!!",
              sent: "November 3rd, 10:05 A.M.",
              body: "We do Australia because we know Australia. Now it's time to talk to the Australia specialist and book your Christmas and New Year's holidays. Also, we're offering special deals to Sydney, Melbourne, and many more tourist attractions in Australia. Call 24 hours a day, 7 days a week. Please visit our Web site www.kangaroo.co.au. We hope to hear from you soon!",
              instruction: "Respond to the e-mail as if you are a customer. In your e-mail, ask TWO questions about the travel packages and make ONE request."
            }
          },
          {
            type: "opinion",
            label: "Write an Opinion Essay",
            questionLabel: "Question 8",
            responseTime: 1800,
            content: {
              prompt: "When it comes to workplace, we normally think we have to go there to work. A lot of us commute to work every day. However, there are some people who work remotely at their homes or away from their offices. What do you think is the reason why some companies permit their employees to work this way?"
            }
          }
        ]
      },
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
