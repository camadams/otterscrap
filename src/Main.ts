import "dotenv/config";
import fs from "fs";
import path from "path";
import { createMessage, sendEmail } from "./email";
var debug = true;
export type AvailabilityItem = { available: string; availableDate: string };

async function getData() {
  const endpoint = "https://production-sfo.browserless.io/chrome/bql";
  const token = process.env.BROWSERLESS_TOKEN;
  const proxyString = "&proxy=residential&proxySticky=true&proxyCountry=us";
  const optionsString = "&humanlike=true&blockConsentModals=true";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
mutation form_example {
  goto(
    url: "https://www.sanparks.org/includes/SANParksApp/API/v1/bookings/activities/getActivityDetails.php?accomTypeNo=396"
  ) {
    text
  }
  query: querySelector(selector: "body") {
    innerText
  }
}
    `,
      operationName: "form_example",
    }),
  };

  const url = `${endpoint}?token=${token}${proxyString}${optionsString}`;
  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}
async function getAvailability(): Promise<AvailabilityItem[]> {
  const data = await getData();
  const res = JSON.parse(data.data.query.innerText);
  const availability = res.DATA[0].availability;
  const availabilityArray = (
    Object.values(availability) as AvailabilityItem[]
  ).map((item) => ({
    available: item.available,
    availableDate: item.availableDate,
  }));
  return availabilityArray;
}

function findDifferenceIndices(
  oldAvailability: string,
  newAvailability: string
): number[] {
  const diffIndices: number[] = [];

  let oldArr: number[] = oldAvailability.split(",").map(Number);
  const newArr: number[] = newAvailability.split(",").map(Number);
  oldArr = oldArr.slice(oldArr.length - newArr.length);

  for (let i = 0; i < oldArr.length; i++) {
    let change = newArr[i] - oldArr[i];
    diffIndices.push(change > 0 ? change : 0);
  }

  return diffIndices;
}

async function main() {
  const availability = await getAvailability();
  const availabilityString = availability
    .map((item) => item.available)
    .join(",");
  const filePath = path.join(__dirname, "lastScrap.txt");
  const lastAvailabilityString = fs.readFileSync(filePath, "utf-8");
  const diffIndices = findDifferenceIndices(
    availabilityString,
    lastAvailabilityString
  );
  console.log({ diffIndices });
  if (diffIndices.some((index) => index > 0)) {
    fs.writeFileSync(filePath, availabilityString);
    const message = createMessage(diffIndices, availability);
    await sendEmail(["camgadams@gmail.com"], message);
  }
}

main().catch(async (err) => {
  const errMessage = `Scraping failed: ${err}`;
  console.error(errMessage);
  await sendEmail(["camgadams@gmail.com"], errMessage);
  process.exit(1);
});
