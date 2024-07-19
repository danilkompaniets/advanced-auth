import nodemailer from "nodemailer";

class MailService {
  transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    } as any);
  }

  async sendActivationMail(to: string, link: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: `Account activation on ${process.env.API_URL}`,
        html: `
          <div>
            <h1>For activation, click the link</h1>
            <a href="${link}">${link}</a>
          </div>
        `,
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default new MailService();
