import fs from "fs";
import path from 'path';
const SecretAdminPassword = fs.readFileSync(path.join('db', 'secretPassword.txt')).toString();
export default SecretAdminPassword;