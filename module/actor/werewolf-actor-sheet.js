/* global game, mergeObject */

import { MortalActorSheet } from "./mortal-actor-sheet.js";
import { rollDice } from "./roll-dice.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {MortalActorSheet}
 */

export class WerewolfActorSheet extends MortalActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["wod20", "sheet", "actor", "werewolf"],
      template: "systems/wod20/templates/actor/werewolf-sheet.html",
      width: 800,
      height: 700,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "stats",
        },
      ],
    });
  }

  constructor(actor, options) {
    super(actor, options);
    this.hunger = true;
  }

  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited)
      return "systems/wod20/templates/actor/limited-sheet.html";
    return "systems/wod20/templates/actor/werewolf-sheet.html";
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    data.sheetType = `${game.i18n.localize("WOD20.Werewolf")}`;

    // Prepare items.
    if (
      this.actor.data.type === "werewolf"
    ) {
      this._prepareItems(data);
    }

    return data;
  }

  /**
   * set Blood Potency for Vampire sheets.
   *
   * @param {Object} actorData The actor to prepare.
   * @return {undefined}
   * @override
   */
  _prepareItems(sheetData) {
    super._prepareItems(sheetData);
    const actorData = sheetData.actor;

    const gifts = [];
    const rites = [];

    // Iterate through items, allocating to containers
    for (const i of sheetData.items) {
      if (i.type === "power") {
        // Append to Gifts
        if (i.data.powertype === "gift") {
            gifts.push(i);
        } else if (i.data.powertype === "rite") {
            rites.push(i);
        }
      }
    }

    // Assign and return
    actorData.gifts_list = gifts;
    actorData.rites_list = rites;
  }

}
