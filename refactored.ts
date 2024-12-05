import moment from 'moment';
import Kldb from './src/kldb';

async function m() {
  await Kldb.player.updateMany({
    data: {
      joined_date:
        new Date(2024, 9, 7).getTime()
    },
    where: {
      role: "AD"
    }
  })
}

m();