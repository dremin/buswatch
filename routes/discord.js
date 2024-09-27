var express = require('express');
var router = express.Router();
var { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

var db = require('../db');
var utils = require('../utils');

router.post('/', verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY), function(req, res, next) {
  const { type, data } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'bus') {
      const busNumberStr = req.body.data.options.find(option => option.name == 'number')?.value.trim().replace(/[^\d ]/g, '');
      
      if (!busNumberStr) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Bus number required.'
          },
        });
      }

      const buses = db.query(`select b.*, r.name as routeName from buses as b left join routes as r on b.route = r.route where vid in (${busNumberStr.split(' ').filter(bus => bus.length).join(',')}) order by vid asc`, false);

      if (!buses.length) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Bus not found.'
          },
        });
      }

      const now = db.getDbDateTime();
      const embeds = buses.map(bus => {
        let color = 689407;
        if (utils.isOutOfService(now, bus.lastSeen)) {
          color = 16729402;
        } else if (utils.isInService(now, bus.lastSeen)) {
          color = 3331915;
        }

        const fields = [
          {
            name: "Route",
            value: `${bus.route}: ${bus.routeName}`,
            inline: true
          },
          {
            name: "Garage",
            value: utils.decodeGarage(bus.blockId, true),
            inline: true
          },
          {
            name: "Block ID",
            value: bus.blockId,
            inline: true
          },
          {
            name: "First Seen",
            value: utils.epochToDisplay(bus.firstSeen),
            inline: true
          },
          {
            name: "Last Seen",
            value: utils.epochToDisplay(bus.lastSeen),
            inline: true
          }
        ];

        if (bus.note) {
          fields.push(
            {
              name: "Notes",
              value: bus.note.replaceAll('\\n', ' '),
              inline: false
            }
          );
        }

        return {
          color,
          title: `Bus ${bus.vid}`,
          thumbnail: {
            url: utils.vidToSeries(bus.vid).image,
          },
          fields
        };
      });
  
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds },
      });
    }
  }

    return res.status(400).json({ error: 'Unknown command' });
});

module.exports = router;
