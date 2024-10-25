# absolute-automation-app
This app will be used to handle all the automation task for The Absolute Fitness

# API Endpoint Details

# Add a single enquiry into DB 
https://automation.theabsolutefitness.com/api/enquiries
http://localhost:3000/api/enquiries
{
  "name": "Hari",
  "phone":"8089947074",
  "lead_generated_date": "19-08-2024",
  "branch": "RKR"
}

# Add bulk of enquiry from csv to DB
https://automation.theabsolutefitness.com/api/enquiries/upload-csv
http://localhost:3000/api/enquiries/upload-csv
{
  "csvFilePath": "https://theabsolutefitness.com/assets/Enquiry.csv"
}
ToDo: Update the lead_generated_date and other fields except the Phone Number when Enquiry is already present 

# Add whatsapp messages to queue with option enquiry number only
https://automation.theabsolutefitness.com/api/whatsapp/create-message-queue
http://localhost:3000/api/whatsapp/create-message-queue
{
  "message": "Hi *{Name}*,\n\n🌟 𝐏𝐫𝐢𝐨𝐫𝐢𝐭𝐢𝐳𝐞 𝐏𝐫𝐨𝐭𝐞𝐢𝐧 𝐢𝐧 𝐄𝐯𝐞𝐫𝐲 𝐌𝐞𝐚𝐥 🌟\n\n💪 𝐏𝐫𝐨𝐭𝐞𝐢𝐧  is crucial for 𝐰𝐞𝐢𝐠𝐡𝐭 𝐥𝐨𝐬𝐬 as it keeps you feeling 𝐟𝐮𝐥𝐥𝐞𝐫 𝐥𝐨𝐧𝐠𝐞𝐫, reduces cravings, and helps maintain muscle while losing fat.🏋️‍\n\nYou can easily include 𝐩𝐫𝐨𝐭𝐞𝐢𝐧-𝐫𝐢𝐜𝐡 𝐟𝐨𝐨𝐝𝐬 like:\n🥚 𝗘𝗴𝗴𝘀 \n🍗 𝗖𝗵𝗶𝗰𝗸𝗲𝗻 \n🍛 𝗟𝗲𝗻𝘁𝗶𝗹𝘀 \n🧀 𝗣𝗮𝗻𝗲𝗲𝗿 \nin your diet. Adding 𝐩𝐫𝐨𝐭𝐞𝐢𝐧 to every meal can naturally help you consume fewer calories and achieve your fat loss goals effectively.🎯\n\n✨ Tip: Include 𝒐𝒏𝒆 𝒑𝒓𝒐𝒕𝒆𝒊𝒏 𝒔𝒐𝒖𝒓𝒄𝒆 in each meal, like a nutritious 𝗶𝗱𝗹𝗶 𝘄𝗶𝘁𝗵 𝘀𝗮𝗺𝗯𝗮𝗿 (extra lentils) or a tasty 𝗰𝗵𝗶𝗰𝗸𝗲𝗻 𝘀𝗮𝗹𝗮𝗱 🥗\n\n💪 Let’s stay 𝒇𝒊𝒕 𝒂𝒏𝒅 𝒉𝒆𝒂𝒍𝒕𝒉𝒚 together!",
  "mediaUrl":"https://theabsolutefitness.com/assets/img/protein.jpg",
  "audienceType": "EnquiryOnly"
}

# Pinger API to send WhatsaApp message
POST
https://pingerbot.in/api/send
{
"number": "918089947074",
"type": "text",
"message": "This is a test message",
"instance_id": "6707B0CF36FFD",
"access_token": "652fc38345240"
}

# Send a WhatsApp Message to a single number
https://automation.theabsolutefitness.com/api/whatsapp/send-message
http://localhost:3000/api/whatsapp/send-message
{
  "number": "8089947074", 
  "message": "Hi,\n\nThis is a Test Message.\n\nPlease ignore this message.",
  "accessToken": "HzW2mCMQvbRwSQy24F38"
}
Send with Instance Id
{
  "number": "8089947074", 
  "message": "Hi,\n\nThis is a Test Message.\n\nPlease ignore this message.",
  "accessToken": "HzW2mCMQvbRwSQy24F38",
  "instance_id": "6707B0CF36FFD"
}
Send a text with media
{
  "number": "8089947074", 
  "message": "Hi *Name* \n🌼 _Ayudha & Saraswati Pooja Wishes!_ 🙏\n\nSpecial offer just for our new inquiries!\n\n🎉 _Vijayadasami Offer_ 🎉  \n\n🔥 *_Buy 6 months, Get 6 months FREE!_* 🔥\n\nDon't miss this LIMITED-TIME opportunity to transform your fitness journey! 💪🏋️‍♂️✨ \nSpots are limited, so call us today to grab your deal! 🏃‍♂️💥\n\n🕒 _Gym Timings_  \n- Shevapet Branch:\n5️⃣:30AM - 9️⃣PM (👩‍🦰 Ladies Only:🔟AM - 4️⃣PM)\n\n- Ramakrishna Branch:\n5️⃣AM - 9️⃣PM (👩‍🦰 Ladies Only:🔟AM - 2️⃣PM)\n\n📞 Call us now! 📲 *09150418332*\n\n🌐 http://www.theabsolutefitness.com\n\nStart your fitness journey today! 🏋️‍♀️✨",
  "mediaUrl": "https://theabsolutefitness.com/assets/Ayudha_Pooja_Wishes.jpeg",
  "type":"media"
  "accessToken": "HzW2mCMQvbRwSQy24F38"
}

# Send the queued messages with the current daily limit configured in db
https://automation.theabsolutefitness.com/api/whatsapp/send-queued-messages
*9
http://localhost:3000/api/whatsapp/send-queued-messages
{
  "accessToken": "HzW2mCMQvbRwSQy24F38"
}

Sends only the high priority message i.e. he nuturing sequence messages
http://localhost:3000/api/whatsapp/send-queued-messages
{
  "accessToken": "HzW2mCMQvbRwSQy24F38",
  "priority": "high"
}

# Meta API Endpoint
GET & POST
https://automation.theabsolutefitness.com/api/meta/webhook
http://localhost:3000/api/meta/webhook

# Google Drive Endpoint 
GET 
https://automation.theabsolutefitness.com/api/google-drive/auth
http://localhost:3000/api/google-drive/auth

POST
https://automation.theabsolutefitness.com/api/google-drive/daily-call-report
http://localhost:3000/api/google-drive/daily-call-report
{
  "userId":"108570473179315136620",
  "folderId":"1-S_2oKT3-zbSK6C_Cuk677SzAVt7Sm0_"
}

# System Health Report Endpoint 
GET 
https://automation.theabsolutefitness.com/api/system-health/send-report
http://localhost:3000/api/system-health/send-report

# Project Structure
/project-root
  /src
    /config
      db.js
    /controllers
      enquiryController.js      
      googleDriveController.js
      metaController.js
      systemHealthController.js
      whatsappController.js
    /integrations
      pingerApiClient.js
      metaIntegration.js
      googleDriveIntegration.js
    /middlewares
      errorHandlerMiddleware.js
      validateAccessToken.js
    /repositories
      enquiryRepository.js
      tokenRepository.js
      waTrackingRepository.js
      whatsappMessageQueueRepository.js
    /routes
      enquiryRoutes.js
      googleDriveRoutes.js
      metaRoutes.js
      systemHealthRoutes.js
      whatsappRoutes.js
    /services
      bulkMessageService.js
      clientService.js
      csvService.js
      enquiryService.js
      googleDriveService.js
      waTrackingService.js
      whatsappMessagingService.js
      whatsappQueueService.js
    /utils
      dateTimeUtils.js
      responseHelpers.js
      systemHealthReport.js
      validationHelpers.js
  /public
  /node_modules
  /tests
    /config
      db.test.js
    /controllers
      enquiryController.test.js
      whatsappController.test.js
      googleDriveController.test.js
      metaController.test.js
    /integrations
      pingerApiClient.test.js
      metaIntegration.test.js
      googleDriveIntegration.test.js
    /middlewares
      errorHandlerMiddleware.test.js
      validateAccessToken.test.js
    /repositories
      enquiryRepository.test.js
      tokenRepository.test.js
      waTrackingRepository.test.js
      whatsappMessageQueueRepository.test.js
    /routes
      enquiryRoutes.test.js
      googleDriveRoutes.test.js
      metaRoutes.test.js
      testRoutes.js
      whatsappRoutes.test.js
    /services
      bulkMessageService.test.js
      clientService.test.js
      csvService.test.js
      enquiryService.test.js
      googleDriveService.test.js
      waTrackingService.test.js
      whatsappMessagingService.test.js
      whatsappQueueService.test.js
    /utils
      dateTimeUtils.test.js
      responseHelpers.test.js
      validationHelpers.test.js
    /setup
      setup.js
      teardown.js
  .env
  .env.development
  .env.production
  .gitignore
  app.js
  server.js
  jest.config.js
  package.json
  package-lock.json
  README.md

# How to Run Test Case
npx jest tests/unit/middlewares/errorHandlerMiddleware.test.js --detectOpenHandles

npx jest tests/unit/app.test.js -t "should handle invalid JSON with a 400 status"

npm run test:e2e