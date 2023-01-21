import {Timezone, UserLocale} from "../types";

export class User {
  readonly DEFAULT_TIMEZONE = "UTC" as Timezone;
  readonly DEFAULT_USER_LOCALE = "en_US" as UserLocale;

  readonly TIMEZONE = "timezone";
  readonly USER_LOCALE = "user-locale";

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

  get locale(): UserLocale {
    const locale = this.properties.getProperty(this.USER_LOCALE);
    return locale !== null ? (locale as UserLocale) : this.DEFAULT_USER_LOCALE;
  }

  set locale(locale: UserLocale) {
    this.properties.setProperty(this.USER_LOCALE, locale);
  }
}
