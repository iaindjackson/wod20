/* global CONFIG, Handlebars, Hooks, Actors, ActorSheet, ChatMessage, Dialog, Items, ItemSheet, Macro, game, ui */

// Import Modules
import { preloadHandlebarsTemplates } from "./templates.js";
import { migrateWorld } from "./migration.js";
import { VampireActor } from "./actor/actor.js";
import { VampireItem } from "./item/item.js";
import { VampireItemSheet } from "./item/item-sheet.js";
import { VampireDie, VampireHungerDie } from "./dice/dice.js";
import { rollDice } from "./actor/roll-dice.js";
import { CoterieActorSheet } from "./actor/coterie-actor-sheet.js";
import { MortalActorSheet } from "./actor/mortal-actor-sheet.js";
import { GhoulActorSheet } from "./actor/ghoul-actor-sheet.js";
import { VampireActorSheet } from "./actor/vampire-actor-sheet.js";
import { VampireDarkAgesSheet } from "./actor/vampire-da-actor-sheet.js";
import { WraithActorSheet } from "./actor/wraith-actor-sheet.js";
import { WerewolfActorSheet } from "./actor/werewolf-actor-sheet.js";

Hooks.once("init", async function () {
  console.log("Initializing Schrecknet...");

  game.settings.register("wod20", "worldVersion", {
    name: "world Version",
    hint: "Automatically upgrades data when the system.json is upgraded.",
    scope: "world",
    config: true,
    default: "1.5",
    type: String,
  });

  game.wod20 = {
    VampireActor,
    VampireItem,
    rollItemMacro,
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = VampireActor;
  CONFIG.Item.documentClass = VampireItem;
  CONFIG.Dice.terms.v = VampireDie;
  CONFIG.Dice.terms.h = VampireHungerDie;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);

  Actors.registerSheet("wod20", VampireActorSheet, {
    label: "Vampire Sheet",
    types: ["vampire", "character"],
    makeDefault: true,
  });
  Actors.registerSheet("wod20", VampireDarkAgesSheet, {
    label: "Vampire Dark Ages Sheet",
    types: ["vampire-da", "character"],
    makeDefault: true,
  });
  Actors.registerSheet("wod20", GhoulActorSheet, {
    label: "Ghoul Sheet",
    types: ["ghoul"],
    makeDefault: true,
  });
  Actors.registerSheet("wod20", MortalActorSheet, {
    label: "Mortal Sheet",
    types: ["mortal"],
    makeDefault: true,
  });
  Actors.registerSheet("wod20", WraithActorSheet, {
    label: "Wraith Sheet",
    types: ["wraith"],
    makeDefault: true,
  });
  Actors.registerSheet("wod20", WerewolfActorSheet, {
    label: "Werewolf Sheet",
    types: ["werewolf"],
    makeDefault: true
  });
  Actors.registerSheet("wod20", CoterieActorSheet, {
    label: "Coterie Sheet",
    types: ["coterie"],
    makeDefault: true,
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("wod20", VampireItemSheet, {
    label: "Item Sheet",
    makeDefault: true,
  });

  preloadHandlebarsTemplates();

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper("concat", function () {
    let outStr = "";
    for (const arg in arguments) {
      if (typeof arguments[arg] !== "object") {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper("or", function (bool1, bool2) {
    return bool1 || bool2;
  });

  Handlebars.registerHelper("and", function (bool1, bool2) {
    return bool1 && bool2;
  });

  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("toUpperCaseFirstLetter", function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  Handlebars.registerHelper('ge', function( a, b ){
    var next =  arguments[arguments.length-1];
    return (a >= b) ? next.fn(this) : next.inverse(this);
  });
  Handlebars.registerHelper('le', function( a, b ){
    var next =  arguments[arguments.length-1];
    console.log(a,b);
    console.log((a <= b)) 
    return (a <= b) ? next.fn(this) : next.inverse(this);
    
  });
  Handlebars.registerHelper("setVar", function(varName, varValue, options) {
    options.data.root[varName] = varValue;
  });
  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  Handlebars.registerHelper("generateFeatureLabel", function (str) {
    return "WOD20.".concat(capitalize(str));
  });

  Handlebars.registerHelper("hasFeature", function (type, feature) {
    if (feature === "passion") {
      return (type === "wraith");
    } else if (feature === "fetter") {
      return (type === "wraith");
    } else {
      return true;
    }
  });

  Handlebars.registerHelper("hasVirtues", function (type) {
    return !(type === "wraith" || type === "werewolf");
  });

  Handlebars.registerHelper("generateSkillLabel", function (str) {
    return "WOD20.".concat(
      str
        .split(" ")
        .flatMap((word) => capitalize(word))
        .join("")
    );
  });

  // TODO: there exist math helpers for handlebars
  Handlebars.registerHelper(
    "frenzy",
    function (willpowerMax, willpowerAgg, willpowerSup, humanity) {
      return (
        willpowerMax - willpowerAgg - willpowerSup + Math.floor(humanity / 3)
      );
    }
  );

  Handlebars.registerHelper(
    "willpower",
    function (willpowerMax, willpowerAgg, willpowerSup) {
      return willpowerMax - willpowerAgg - willpowerSup;
    }
  );

  // TODO: there exist math helpers for handlebars
  Handlebars.registerHelper("remorse", function (humanity, stain) {
    return 10 - humanity - stain;
  });

  Handlebars.registerHelper("numLoop", function (num, options) {
    let ret = "";

    for (let i = 0, j = num; i < j; i++) {
      ret = ret + options.fn(i);
    }

    return ret;
  });
  Handlebars.registerHelper("minus", function (a, b) {
    return a - b;
  });
  Handlebars.registerHelper("equal", function (a, b, label) {
    return a == b ? label : "";
  });
  Handlebars.registerHelper("getPowerName", function (key, roll = false) {
    const powers = {
      // Vampire Disciplines
      abombwe: "WOD20.Abombwe",
      animalism: "WOD20.Animalism",
      auspex: "WOD20.Auspex",
      bardo: "WOD20.Bardo",
      celerity: "WOD20.Celerity",
      chimerstry: "WOD20.Chimerstry",
      daimonion: "WOD20.Daimonion",
      dementation: "WOD20.Dementation",
      dominate: "WOD20.Dominate",
      flight: "WOD20.Flight",
      fortitude: "WOD20.Fortitude",
      melpominee: "WOD20.Melpominee",
      mytherceria: "WOD20.Mytherceria",
      obeah: "WOD20.Obeah",
      obfuscate: "WOD20.Obfuscate",
      obtenebration: "WOD20.Obtenebration",
      potence: "WOD20.Potence",
      presence: "WOD20.Presence",
      protean: "WOD20.Protean",
      quietus: "WOD20.Quietus",
      sanguinus: "WOD20.Sanguinus",
      serpentis: "WOD20.Serpentis",
      spiritus: "WOD20.Spiritus",
      temporis: "WOD20.Temporis",
      thanatosis: "WOD20.Thanatosis",
      valeren: "WOD20.Valeren",
      vicissitude: "WOD20.Vicissitude",
      visceratika: "WOD20.Visceratika",
      thaumaturgy: "WOD20.Thaumaturgy",
      necromancy: "WOD20.Necromancy",
      oblivion: "WOD20.Oblivion",
      rituals: "WOD20.Rituals",
      ceremonies: "WOD20.Ceremonies",

      // Wraith Arcanoi
      argos: "WOD20.Argos",
      castigation: "WOD20.Castigation",
      embody: "WOD20.Embody",
      fatalism: "WOD20.Fatalism",
      flux: "WOD20.Flux",
      inhabit: "WOD20.Inhabit",
      intimation: "WOD20.Intimation",
      keening: "WOD20.Keening",
      lifeweb: "WOD20.Lifeweb",
      mnemosynis: "WOD20.Mnemosynis",
      moliate: "WOD20.Moliate",
      outrage: "WOD20.Outrage",
      pandemonium: "WOD20.Pandemonium",
      phantasm: "WOD20.Phantasm",
      puppetry: "WOD20.Puppetry",
      usury: "WOD20.Usury",

      // Spectre Dark Arcanoi
      collogue: "WOD20.Collogue",
      contaminate: "WOD20.Contaminate",
      corruption: "WOD20.Corruption",
      larceny: "WOD20.Larceny",
      maleficence: "WOD20.Maleficence",
      shroudRending: "WOD20.ShroudRending",
      tempestos: "WOD20.Tempestos",
      tempestWeaving: "WOD20.TempestWeaving",
    };
    // if (roll) {
    //   // if (key === "rituals") {
    //   //   return disciplines.sorcery;
    //   // } else
    //   if (key === "ceremonies") {
    //     return disciplines.oblivion;
    //   }
    // }
    return powers[key];
  });
});

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createVampireMacro(data, slot));
});

Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addSystem({ id: "wod20", name: "WoD20" }, true);
  dice3d.addDicePreset({
    type: "dv",
    labels: [
      "systems/wod20/assets/images/normal-fail-dsn.png",
      "systems/wod20/assets/images/normal-fail-dsn.png",
      "systems/wod20/assets/images/normal-fail-dsn.png",
      "systems/wod20/assets/images/normal-fail-dsn.png",
      "systems/wod20/assets/images/normal-fail-dsn.png",
      "systems/wod20/assets/images/normal-success-dsn.png",
      "systems/wod20/assets/images/normal-success-dsn.png",
      "systems/wod20/assets/images/normal-success-dsn.png",
      "systems/wod20/assets/images/normal-success-dsn.png",
      "systems/wod20/assets/images/normal-crit-dsn.png",
    ],
    colorset: "black",
    fontScale: 0.5,
    system: "wod20",
  });
  dice3d.addColorset(
    {
      name: "hunger",
      description: "V5 Hunger Dice",
      category: "V5",
      foreground: "#fff",
      background: "#450000",
      texture: "none",
      edge: "#450000",
      material: "plastic",
      font: "Arial Black",
      fontScale: {
        d6: 1.1,
        df: 2.5,
      },
    },
    "default"
  );
  dice3d.addDicePreset({
    type: "dh",
    labels: [
      "systems/wod20/assets/images/bestial-fail-dsn.png",
      "systems/wod20/assets/images/red-fail-dsn.png",
      "systems/wod20/assets/images/red-fail-dsn.png",
      "systems/wod20/assets/images/red-fail-dsn.png",
      "systems/wod20/assets/images/red-fail-dsn.png",
      "systems/wod20/assets/images/red-success-dsn.png",
      "systems/wod20/assets/images/red-success-dsn.png",
      "systems/wod20/assets/images/red-success-dsn.png",
      "systems/wod20/assets/images/red-success-dsn.png",
      "systems/wod20/assets/images/red-crit-dsn.png",
    ],
    colorset: "hunger",
    system: "wod20",
  });
});

/* -------------------------------------------- */
/*  Add willpower reroll                        */
/* -------------------------------------------- */

// Create context menu option on selection
// TODO: Add condition that it only shows up on willpower-able rolls
Hooks.on("getChatLogEntryContext", function (html, options) {
  options.push({
    name: game.i18n.localize("WOD20.WillpowerReroll"),
    icon: '<i class="fas fa-redo"></i>',
    condition: (li) => {
      // Only show this context menu if the person is GM or author of the message
      const message = game.messages.get(li.attr("data-message-id"));

      return game.user.isGM || message.isAuthor;
    },
    callback: (li) => willpowerReroll(li),
  });
});

Hooks.once("ready", function () {
  migrateWorld();
});

async function willpowerReroll(roll) {
  const dice = roll.find(".normal-dice");
  const diceRolls = [];

  // Go through the message's dice and add them to the diceRolls array
  Object.keys(dice).forEach(function (i) {
    // This for some reason returns "prevObject" and "length"
    // Fixes will be attempted, but for now solved by just ensuring the index is a number
    if (i > -1) {
      diceRolls.push(`<div class="die">${dice[i].outerHTML}</div>`);
    }
  });

  // Create dialog for rerolling dice
  const template = `
    <form>
        <div class="window-content">
            <label><b>Select dice to reroll (Max 3)</b></label>
            <hr>
            <span class="dice-tooltip">
              <div class="dice-rolls willpowerReroll flexrow">
                ${diceRolls.reverse().join("")}
              </div>
            </span>
        </div>
    </form>`;

  let buttons = {};
  buttons = {
    draw: {
      icon: '<i class="fas fa-check"></i>',
      label: "Reroll",
      callback: (roll) => rerollDie(roll),
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel",
    },
  };

  new Dialog({
    title: "Willpower Reroll",
    content: template,
    buttons: buttons,
    render: function () {
      $(".willpowerReroll .die").on("click", dieSelect);
    },
    default: "draw",
  }).render(true);
}

// Handles selecting and de-selecting the die
function dieSelect() {
  // If the die isn't already selected and there aren't 3 already selected, add selected to the die
  if (
    !$(this).hasClass("selected") &&
    $(".willpowerReroll .selected").length < 3
  ) {
    $(this).addClass("selected");
  } else {
    $(this).removeClass("selected");
  }
}

// Handles rerolling the number of dice selected
// TODO: Make this function duplicate/replace the previous roll with the new results
// TODO: Make this function able to tick superficial willpower damage
// For now this works well enough as "roll three new dice"
function rerollDie(actor) {
  const diceSelected = $(".willpowerReroll .selected").length;

  // If there is at least 1 die selected and aren't any more than 3 die selected, reroll the total number of die and generate a new message.
  if (diceSelected > 0 && diceSelected < 4) {
    rollDice(diceSelected, actor, "Willpower Reroll", 0, false);
  }
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createVampireMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data))
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items"
    );
  const item = data.data;

  // Create the macro command
  const command = `game.wod20.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "wod20.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find((i) => i.name === itemName) : null;
  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemName}`
    );

  // Trigger the item roll
  return item.roll();
}
