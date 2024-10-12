var express = require('express');
var router = express.Router();
var { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');
const axios = require('axios');

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
        const isInService = utils.isInService(now, bus.lastSeen);
        let color = 689407;
        let image = null;
        if (utils.isOutOfService(now, bus.lastSeen)) {
          color = 16729402;
        } else if (isInService) {
          color = 3331915;
        }

        if (isInService && bus.latitude && bus.longitude && process.env.GEOAPIFY_API_KEY && process.env.BASE_URL) {
          image = { url: `${process.env.BASE_URL}/discord/map/${bus.latitude}/${bus.longitude}/image.jpg` };
        }

        const fields = [
          {
            name: "Route",
            value: `${bus.route}: ${bus.routeName}${bus.destination ? ' to ' + bus.destination : ''}`,
            inline: false
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
          description: `${utils.decodeGarage(bus.blockId, true)} Garage`,
          thumbnail: {
            url: utils.vidToSeries(bus.vid).image,
          },
          fields,
          image
        };
      });
      console.log(JSON.stringify(embeds, 2))
  
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { embeds },
      });
    }
  }

    return res.status(400).json({ error: 'Unknown command' });
});

router.get('/map/:latitude/:longitude/image.jpg', async function(req, res, next) {
  
  try {
    const response = await axios.get(`https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=400&height=300&center=lonlat:${req.params.longitude},${req.params.latitude}&zoom=16&marker=lonlat:${req.params.longitude},${req.params.latitude};type:circle;color:%2314cf00;icon:directions-bus;icontype:material;textsize:small&scaleFactor=2&apiKey=${process.env.GEOAPIFY_API_KEY}`, { responseType: 'arraybuffer' });
    
    if (response.status === 200) {
      res.set("Content-Type", "image/jpeg");
      res.send(response.data);
      return;
    }
  } catch (error) {
    console.error(error);
  }
  
  return res.status(400).json({ error: 'Error generating image' });
});

module.exports = router;
