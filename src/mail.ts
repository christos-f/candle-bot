import nodemailer from "nodemailer"

  // async..await is not allowed in global scope, must use a wrapper
  export default async function sendNotifications(message: string) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        auth: {
          // TODO: replace `user` and `pass` values from <https://forwardemail.net>
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      

    // send mail with defined transport object
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: process.env.RECIPIENT_EMAIL, // list of receivers
      subject: "Bath and Body Works Notification", // Subject line
      text: message, // plain text body
    });
  }
  