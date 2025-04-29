import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { Resend } from "resend";
import { AvailabilityItem } from "./Main";

export async function sendEmail(toAddress: string[], message: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: toAddress,
    subject: "Sanparks Availability Alert",
    html: message,
  });
}

export function createMessage(
  diffIndices: number[],
  availabilityArray: AvailabilityItem[]
): string {
  let availableString = "";
  let firstAvailableDate = "";
  for (let i = 0; i < diffIndices.length; i++) {
    if (diffIndices[i] > 0) {
      availableString += `<p>${diffIndices[i]} new spots available on ${availabilityArray[i].availableDate}.</p>\r\n`;
      firstAvailableDate = availabilityArray[i].availableDate;
    }
  }
  return `
<div>
  <p>The following dates have recently become available for Otter Trail: </p>
  ${availableString}
  <p>Click <a href="https://www.sanparks.org/reservations/overnight-activity-details/396/1/${firstAvailableDate}">here</a> to book.</p>
</div>`;
}
