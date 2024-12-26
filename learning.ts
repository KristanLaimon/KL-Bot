import fs from "fs"
import { WAMessage } from '@whiskeysockets/baileys';

const paths = fs.readdirSync('db/ranks', { withFileTypes: true });
// const paths = fs.readdirSync('db/tournaments_covers');


const end: number = 0;

// it("Should spy on math add function", () => {
//   expect((math.add as jest.Mock).mock.calls.length).toBe(1);
// });

// console.log(math.add(2, 3)); // Output: 10