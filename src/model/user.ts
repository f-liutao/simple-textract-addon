import { Timezone } from "../types";

export class User {
  readonly DEFAULT_TIMEZONE = "UTC" as Timezone;
  readonly TIMEZONE = "timezone";

  get properties() {
    return PropertiesService.getUserProperties();
  }

  get timezone(): Timezone {
    const tz = this.properties.getProperty(this.TIMEZONE);
    return tz !== null ? (tz as Timezone) : this.DEFAULT_TIMEZONE;
  }

  set timezone(tz: Timezone) {
    this.properties.setProperty(this.TIMEZONE, tz);
  }
}
