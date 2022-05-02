
/* global Dialog, game, mergeObject */

import { MortalActorSheet } from "./mortal-actor-sheet.js";
import { rollDice } from "./roll-dice.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WraithActorSheet}
 */

export class WraithActorSheet extends MortalActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["wod20", "sheet", "actor", "wraith"],
      template: "systems/wod20/templates/actor/wraith-sheet.html",
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

  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited)
        return "systems/wod20/templates/actor/limited-sheet.html";
    return "systems/wod20/templates/actor/wraith-sheet.html";
  }

  /** @override */
  getData() {
    const data = super.getData();

    data.sheetType = `${game.i18n.localize("WOD20.Wraith")}`;

    // Prepare items.
    if (this.actor.data.type === "wraith") {
      this._prepareItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Arcanoi for Wraith sheets.
   *
   * @param {Object} actorData The actor to prepare.
   * @return {undefined}
   * @override
   */
   _prepareItems(sheetData) {
    super._prepareItems(sheetData);
    const actorData = sheetData.actor;

    const arcanoi = {
      argos: [],
      castigation: [],
      embody: [],
      fatalism: [],
      flux: [],
      inhabit: [],
      intimation: [],
      keening: [],
      lifeweb: [],
      mnemosynis: [],
      moliate: [],
      outrage: [],
      pandemonium: [],
      phantasm: [],
      puppetry: [],
      usury: [],

      // Spectre Dark Arcanoi
      collogue: [],
      contaminate: [],
      corruption: [],
      larceny: [],
      maleficence: [],
      shroudRending: [],
      tempestos: [],
      tempestWeaving: []
    };
    
    // Iterate through items, allocating to containers
    for (const i of sheetData.items) {
      if (i.type === "power") {
        // Append to arcanoi.
        if (i.data.powertype === "arcanoi" && i.data.power !== undefined) {
          if (i.data.power in arcanoi) {
            arcanoi[i.data.power].push(i);
            if (!this.actor.data.data.arcanoi[i.data.power].visible) {
              this.actor.update({
                [`data.arcanoi.${i.data.power}.visible`]: true,
              });
            }
          }
        }
      }
    }

    // Assign and return
    actorData.arcanoi_list = arcanoi;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Make Arcanoi visible
    html.find(".arcanoi-create").click(this._onShowArcanoi.bind(this));

    // Make Arcanoi hidden
    html.find(".arcanoi-delete").click((ev) => {
      const data = $(ev.currentTarget)[0].dataset;
      this.actor.update({
        [`data.arcanoi.${data.power}.visible`]: false,
      });
    });

    // Rollable Wraith powers
    html.find(".power-rollable").click(this._onWraithRoll.bind(this));
  }

  /**
   * Handle making a discipline visible
   * @param {Event} event   The originating click event
   * @private
   */
  _onShowArcanoi(event) {
    event.preventDefault();
    let options = "";
    for (const [key, value] of Object.entries(this.actor.data.data.arcanoi)) {
      options = options.concat(
        `<option value="${key}">${game.i18n.localize(value.name)}</option>`
      );
    }

    const template = `
      <form>
        <div class="form-group">
          <label>${game.i18n.localize("WOD20.SelectArcanoi")}</label>
          <select id="arcanoiSelect">${options}</select>
        </div>
      </form>`;

    let buttons = {};
    buttons = {
      draw: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("WOD20.Add"),
        callback: async (html) => {
          const arcanoi = html.find("#arcanoiSelect")[0].value;
          this.actor.update({
            [`data.arcanoi.${arcanoi}.visible`]: true,
          });
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("WOD20.Cancel"),
      },
    };

    new Dialog({
      title: game.i18n.localize("WOD20.AddArcanoi"),
      content: template,
      buttons: buttons,
      default: "draw",
    }).render(true);
  }

  _onWraithRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const item = this.actor.items.get(dataset.id);
    const arcanoiValue = this.actor.data.data.arcanoi[item.data.data.power].value;

    const dice1 =
      item.data.data.dice1 === "power"
        ? arcanoiValue
        : this.actor.data.data.abilities[item.data.data.dice1].value;

    let dice2;
    if (item.data.data.dice2 === "power") {
      dice2 = arcanoiValue;
    } else if (item.data.data.skill) {
      dice2 = this.actor.data.data.skills[item.data.data.dice2].value;
    } else {
      dice2 = this.actor.data.data.abilities[item.data.data.dice2].value;
    }

    const dicePool = dice1 + dice2;
    rollDice(dicePool, this.actor, `${item.data.name}`, 6, this.hunger);
  }

}