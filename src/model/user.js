export class User {
    constructor() {
        this.DEFAULT_TIMEZONE = "UTC";
        this.DEFAULT_USER_LOCALE = "en_US";
        this.TIMEZONE = "timezone";
        this.USER_LOCALE = "user-locale";
    }
    get properties() {
        return PropertiesService.getUserProperties();
    }
    get timezone() {
        const tz = this.properties.getProperty(this.TIMEZONE);
        return tz !== null ? tz : this.DEFAULT_TIMEZONE;
    }
    set timezone(tz) {
        this.properties.setProperty(this.TIMEZONE, tz);
    }
    get locale() {
        const locale = this.properties.getProperty(this.USER_LOCALE);
        return locale !== null ? locale : this.DEFAULT_USER_LOCALE;
    }
    set locale(locale) {
        this.properties.setProperty(this.USER_LOCALE, locale);
    }
}
