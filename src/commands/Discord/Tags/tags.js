const { DiscordCommand } = require('../../../core');

const w = require('wumpfetch');
const { table } = require('table');

module.exports = class Tags extends DiscordCommand {
  constructor(bot) {
    super(bot, {
      path       : undefined,
      name       : 'tags',
      syntax     : 'tags',
      bearer     : 'yorushika',
      aliases    : [],
      argument   : [],
      description: 'A list of all tags',

      hidden     : false,
      enabled    : true,
      cooldown   : 2500,
      category   : 'Tags',
      ownerOnly  : false,
      guildOnly  : true,
      permissions: []
    });

    this.static = {
      limit: 35,
      BASE_URL: 'https://hastebin.com',
      TABLE_CONFIG: {
        border: {
            topBody: `-`,
            topJoin: `+`,
            topLeft: `+`,
            topRight: `+`,

            bottomBody: `-`,
            bottomJoin: `+`,
            bottomLeft: `+`,
            bottomRight: `+`,

            bodyLeft: `|`,
            bodyRight: `|`,
            bodyJoin: `|`,

            joinBody: `-`,
            joinLeft: `+`,
            joinRight: `+`,
            joinJoin: `+`
        },
        drawHorizontalLine: (_, s) => {
            return _ === 0 || _ === 1 || _ === s;
        }
      }
    };

    Object.freeze(this);
    Object.freeze(this.static);
  }

  async execute(msg) {
    let data = [ [ 'Tag', 'Author', 'Used' ] ];
    const tags = await this.bot.schema.tag.find({ 'author.guild': msg.channel.guild.id }).sort({ used: -1 });

    if (!tags || tags === null || tags.length <= 0) {
      return msg.channel.createMessage(this._localize(msg.author.locale.tags.all.none, { prefix: msg.prefix }));
    }

    const extData = {
      tags: Array.list(tags.map((v) => `${this.bot.util.escapeMarkdown(v.name)} (\`${v.uses}\`)`).slice(0, this.static.limit), '**,** ', '**and** '),
      guild: msg.channel.guild.name
    };
    
    if (tags.length > this.static.limit) {
      tags.map((v) => data.push([ v.name, `${v.author.name}#${v.author.discrim}`, v.uses ]));

      const req = await w(`${this.mutable.BASE_URL}/documents`, { method: 'POST', data: table(data, this.mutable.TABLE_CONFIG) }).send();
      const res = req.json();
      
      extData.tags += `\n${this._localize(msg.author.locale.tags.all.extend, { extend: `${this.mutable.BASE_URL}/raw/${res.key}.txt` })}`;
    }

    msg.channel.createMessage({
      embed: {
        color: this.bot.col.tag.list,
        description: this._localize(msg.author.locale.tags.all.list.join('\n'), extData)
      }
    });
  }

  _localize(msg, extData = {}) {
    try {
      if (!msg) throw 'INVALID_STRING';

      if (extData) {
        if (extData.guild) {
          msg = msg.replace(/\$\[guild:name]/g, extData.guild);
        }
        if (extData.tags) {
          msg = msg.replace(/\$\[tag:list]/g, extData.tags);
        }
        if (extData.extend) {
          msg = msg.replace(/\$\[tag:full]/g, extData.extend);
        }
        if (extData.prefix) {
          msg = msg.replace(/\$\[tag:cmd]/g, `${extData.prefix}${this.bot.cmds.get('tag-add').extData.syntax}`);
        }
      }
    
      return msg
        .replace(/\$\[emoji#0]/g, this.bot.emote('tags', 'list', '0'))
        .replace(/\$\[emoji#1]/g, this.bot.emote('tags', 'list', '1'))
        .replace(/\$\[emoji#2]/g, this.bot.emote('tags', 'list', '2'));
    } catch (ex) {
      return `LOCALIZE_ERROR:${ex}`;
    }
  }
};