// worker.js
const kafka = require("./kafka");
const nodemailer = require("nodemailer");
require("dotenv").config();

const consumer = kafka.consumer({ groupId: "job-consumers" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "job-posted", fromBeginning: false });

  console.log("🔥 Worker running... waiting for messages");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const jobData = JSON.parse(message.value.toString());
      console.log("📨 Job Received:", jobData);

      // Fetch subscribers
      const subscribers = await Subscriber.find();

      for (const sub of subscribers) {
        await transporter.sendMail({
          from: `"Freshers Jobs" <${process.env.MAIL_USER}>`,
          to: sub.email,
          subject: `New Job Posted: ${jobData.title}`,
          html: `
            <h2>${jobData.title}</h2>
            <p><b>${jobData.company}</b></p>
            <p>${jobData.description}</p>
            <a href="https://freshersjobs.shop/jobs/${jobData.id}">View Job</a>
          `,
        });

        console.log("📩 Email sent to:", sub.email);
      }
    },
  });
}

run().catch(console.error);
