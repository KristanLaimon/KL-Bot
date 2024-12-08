import * as datesutils from "./dates";
import * as dbutils from "./db";
import * as filesystemutils from "./filesystem";
import * as memberUtils from "./members";
import * as phonenumbersUtils from "./phonenumbers";
import * as rawmsgsUtils from "./rawmsgs";
import * as stringUtils from "./strings";

const allUtils: {
  Date: typeof datesutils;
  Db: typeof dbutils;
  FileSystem: typeof filesystemutils;
  Member: typeof memberUtils;
  PhoneNumber: typeof phonenumbersUtils;
  Msg: typeof rawmsgsUtils;
  String: typeof stringUtils;
} = {
  Date: { ...datesutils },
  Db: { ...dbutils },
  FileSystem: { ...filesystemutils },
  Member: { ...memberUtils },
  PhoneNumber: { ...phonenumbersUtils },
  Msg: { ...rawmsgsUtils },
  String: { ...stringUtils }
};

export type AllUtilsType = typeof allUtils;

export default allUtils;