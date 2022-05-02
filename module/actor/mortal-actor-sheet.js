/* global DEFAULT_TOKEN, Dialog, duplicate, game, mergeObject */

// Export this function to be used in other scripts
import { CoterieActorSheet } from "./coterie-actor-sheet.js";
import { rollDice } from "./roll-dice.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {CoterieActorSheet}
 */

export class MortalActorSheet extends CoterieActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["wod20", "sheet", "actor", "mortal"],
      template: "systems/wod20/templates/actor/mortal-sheet.html",
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
    this.isCharacter = true;
    this.hunger = false;
  }

  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited)
      return "systems/wod20/templates/actor/limited-sheet.html";
    return "systems/wod20/templates/actor/mortal-sheet.html";
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    // TODO: confirm that I can finish and use this list
    data.sheetType = `${game.i18n.localize("WOD20.Mortal")}`;

    // Prepare items.
    if (this.actor.data.type === "mortal") {
      this._prepareItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for all sheets.
   *
   * @param {Object} actorData The actor to prepare.
   * @return {undefined}
   * @override
   */
  _prepareItems(sheetData) {
    super._prepareItems(sheetData);
    const actorData = sheetData.actor;

    // Initialize containers.
    const specialties = [];
    const boons = [];
    const customRolls = [];

    // Iterate through items, allocating to containers
    for (const i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === "specialty") {
        // Append to specialties.
        specialties.push(i);
      } else if (i.type === "boon") {
        // Append to boons.
        boons.push(i);
      } else if (i.type === "customRoll") {
        // Append to custom rolls.
        customRolls.push(i);
      }
    }
    // Assign and return
    actorData.specialties = specialties;
    actorData.boons = boons;
    actorData.customRolls = customRolls;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    this._setupDotCounters(html);
    this._setupSquareCounters(html);
    this._setupHealthCounters(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Ressource squares (Health, Willpower)
    html
      .find(".resource-counter .resource-counter-step")
      .click(this._onSquareCounterChange.bind(this));
    html.find(".resource-plus").click(this._onResourceChange.bind(this));
    html.find(".resource-minus").click(this._onResourceChange.bind(this));

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));
    html.find(".custom-rollable").click(this._onCustomVampireRoll.bind(this));
    html
      .find(".specialty-rollable")
      .click(this._onCustomVampireRoll.bind(this));
    // Rollable abilities.
    html.find(".vrollable").click(this._onRollDialog.bind(this));
  }

  /**   * Handle clickable Vampire rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollDialog(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    let options = "";
    for (const [key, value] of Object.entries(this.actor.data.data.abilities)) {
      options = options.concat(
        `<option value="${key}">${game.i18n.localize(value.name)}</option>`
      );
    }
    let healthOptions = ""
    for (const [key, value] of Object.entries(this.actor.data.data.woundPenalties)) {
      healthOptions = healthOptions.concat(
        `<option value="${key}">${game.i18n.localize(value.name)}</option>`
      );
    }

    let wounded = 
    `<div class="form-group">
      <label>${game.i18n.localize("WOD20.SelectWound")}</label>
      <select id="woundSelect">${healthOptions}</select>
    </div>`;

    let specialty;
    let selectAbility;

    // If rolling an attribute, don't pick up another attribute as well
    if (dataset.noability === "true") {
      selectAbility = ""
      specialty = ``
    }
    else {
      selectAbility = `<div class="form-group">
                      <label>${game.i18n.localize("WOD20.SelectAbility")}</label>
                      <select id="abilitySelect">${options}</select>
                    </div>`;
      specialty = `<input id="specialty" type="checkbox"> Specialty </input>`;
    }
    const template = `
      <form>
          `
      + selectAbility +
      ` 
          
          <div class="form-group">
              <label>${game.i18n.localize("WOD20.Modifier")}</label>
              <input type="text" id="inputMod" value="0">
          </div>  
          <div class="form-group">
              <label>${game.i18n.localize("WOD20.Difficulty")}</label>
              <input type="text" min="0" id="inputDif" value="6">
          </div>
          ` + wounded + specialty + `
      </form>`;

    let buttons = {};
    buttons = {

      draw: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("WOD20.Roll"),
        callback: async (html) => {
          const ability = html.find("#abilitySelect")[0]?.value;
          const abilityVal = this.actor.data.data.abilities[ability]?.value;
          const abilityName = game.i18n.localize(
            this.actor.data.data.abilities[ability]?.name
          );
          const woundPenalty = html.find("#woundSelect")[0]?.value;
          const woundPenaltyVal = this.actor.data.data.woundPenalties[woundPenalty]?.value;
          const woundName = game.i18n.localize(
            this.actor.data.data.woundPenalties[woundPenalty]?.name
          );
          const modifier = parseInt(html.find("#inputMod")[0].value || 0);
          const difficulty = parseInt(html.find("#inputDif")[0].value || 0);
          const specialty = parseInt(html.find("#specialty")[0]?.checked || false);
          const numDice = dataset.noability !== "true" ? abilityVal + parseInt(dataset.roll) + modifier : parseInt(dataset.roll) + modifier;

          rollDice(
            numDice,
            this.actor,
            dataset.noability !== "true"
              ? `${abilityName} + ${dataset.label}`
              : `${dataset.label}`,
            difficulty,
            this.hunger,
            specialty,
            woundPenaltyVal
          );
          // this._vampireRoll(numDice, this.actor, `${dataset.label} + ${abilityName}`, difficulty)
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("WOD20.Cancel"),
      },
    };

    new Dialog({

      title: `${dataset.label}...`,
      content: template,
      buttons: buttons,
      default: "draw",
    }).render(true);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const useHunger = this.hunger && dataset.useHunger === "1";
    const numDice = dataset.roll;
    console.log(dataset.roll);
    rollDice(numDice, this.actor, `${dataset.label}`, 0, useHunger);
  }

  _onCustomVampireRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    if (dataset.dice1 === "") {
      const dice2 =
        this.actor.data.data.skills[dataset.dice2.toLowerCase()].value;
      dataset.roll = dice2 + 1; // specialty modifier
      dataset.label = dataset.name;
      this._onRollDialog(event);
    } else {
      const dice1 =
        this.actor.data.data.abilities[dataset.dice1.toLowerCase()].value;
      const dice2 =
        this.actor.data.data.skills[dataset.dice2.toLowerCase()].value;
      const dicePool = dice1 + dice2;
      rollDice(dicePool, this.actor, `${dataset.name}`, 0, this.hunger);
    }
  }

  _setupHealthCounters(html) {
    html.find(".health-counter").each(function () {
      const bashing = parseInt(this.dataset.bashing || 0);
      const lethal = parseInt(this.dataset.lethal || 0);
      const aggravated = parseInt(this.dataset.aggravated || 0);

      const values = new Array(aggravated + lethal + bashing);

      values.fill("*", 0, aggravated);
      values.fill("x", aggravated, aggravated + lethal);
      values.fill("/", aggravated + lethal, aggravated + lethal + bashing);

      $(this)
        .find(".health-counter-step")
        .each(function () {
          this.dataset.state = "";
          if (this.dataset.index < values.length) {
            this.dataset.state = values[this.dataset.index];
          }
        });
    });

    html.find(".health-damage").click(this._onInflictDamage.bind(this));
    html.find(".health-heal").click(this._onHealDamage.bind(this));
  }

  _onInflictDamage(event) {

    const template = `
      <form>
        <div class="form-group">
          <label>${game.i18n.localize("WOD20.Type")}</label>
          <select id="damageSelect">
            <option value="aggravated">${game.i18n.localize("WOD20.Aggravated")}</option>
            <option value="lethal" selected="selected">${game.i18n.localize("WOD20.Lethal")}</option>
            <option value="bashing">${game.i18n.localize("WOD20.Bashing")}</option>
          </select>
        </div>          
        <div class="form-group">
          <label>${game.i18n.localize("WOD20.Damage")}</label>
          <input type="text" id="damage" value="1">
        </div>
      </form>`;

    let buttons = {};
    buttons = {
      draw: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("WOD20.InflictDamage"),
        callback: async (html) => {
          const damageType = html.find("#damageSelect")[0].value;
          const damage = parseInt(html.find("#damage")[0].value || 0);
          this._inflictDamage(damageType, damage);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("WOD20.Cancel"),
      },
    };

    new Dialog({
      title: game.i18n.localize("WOD20.InflictDamage"),
      content: template,
      buttons: buttons,
      default: "draw",
    }).render(true);

  }

  _onHealDamage(event) {
    const template = `
      <form>
        <div class="form-group">
          <label>${game.i18n.localize("WOD20.Type")}</label>
          <select id="damageSelect">
            <option value="aggravated">${game.i18n.localize("WOD20.Aggravated")}</option>
            <option value="lethal" selected="selected">${game.i18n.localize("WOD20.Lethal")}</option>
            <option value="bashing">${game.i18n.localize("WOD20.Bashing")}</option>
          </select>
        </div>          
        <div class="form-group">
          <label>${game.i18n.localize("WOD20.Damage")}</label>
          <input type="text" id="damage" value="1">
        </div>
      </form>`;

    let buttons = {};
    buttons = {
      draw: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("WOD20.HealDamage"),
        callback: async (html) => {
          const damageType = html.find("#damageSelect")[0].value;
          const damage = parseInt(html.find("#damage")[0].value || 0);
          this._healDamage(damageType, damage);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("WOD20.Cancel"),
      },
    };

    new Dialog({
      title: game.i18n.localize("WOD20.HealDamage"),
      content: template,
      buttons: buttons,
      default: "draw",
    }).render(true);
  }

  _inflictDamage(damageType, damage) {
    if (damage <= 0) return;

    const actorData = duplicate(this.actor);
    const health = actorData.type === "wraith" ? actorData.data.corpus : actorData.data.health;

    if (damageType === "aggravated") {
      health.aggravated = health.aggravated + damage;
    } else if (damageType === "lethal") {
      health.lethal = health.lethal + damage;
    } else if (damageType === "bashing") {
      health.bashing = health.bashing + damage;
    }

    const total = health.aggravated + health.lethal + health.bashing;
    const excess = {
      aggravated: 0,
      lethal: 0,
      bashing: 0
    };

    // Trim out any excess damage and report it. 
    if (total > health.max) {
      let diff = total - health.max;

      // Trim bashing damage
      excess.bashing = Math.min(diff, health.bashing);
      diff = diff - excess.bashing;
      health.bashing = health.bashing - excess.bashing;

      // Trim lethal damage
      excess.lethal = Math.min(diff, health.lethal);
      diff = diff - excess.lethal;
      health.lethal = health.lethal - excess.lethal;

      // Trim aggravated damage
      excess.aggravated = Math.min(diff, health.aggravated);
      diff = diff - excess.aggravated;
      health.aggavated = health.aggavated - excess.aggravated;
    }

    // TODO - For mortals and mages, bashing will upgrade to lethal if it continues - check for excess bashing upgrading to lethal
    // In this case aggravated is the equivalent of lethal, unlike for supers which can only be slain in a few cases of taking excess aggravated damage

    // TODO - Chat message to inform damage has been inflicted with excess damage
    this.actor.update(actorData);
  }

  _healDamage(damageType, damage) {

    const actorData = duplicate(this.actor);
    const health = actorData.type === "wraith" ? actorData.data.corpus : actorData.data.health;

    if (damageType === "aggravated") {
      health.aggravated = Math.max(health.aggravated - damage, 0);
    } else if (damageType === "lethal") {
      health.lethal = Math.max(health.lethal - damage, 0);
    } else if (damageType === "bashing") {
      health.bashing = Math.max(health.bashing - damage, 0);
    }

    // No need to check for overflow with healing

    // TODO - Chat message to inform that healing has been performed

    this.actor.update(actorData);
  }

  _onSquareCounterChange(event) {
    event.preventDefault();

    const actorData = duplicate(this.actor);

    const element = event.currentTarget;
    const index = Number(element.dataset.index);
    const oldState = element.dataset.state || "";

    const parents = $(element).parents(".resource-counter");
    const parent = parents[0];
    const dataset = parent.dataset;
    const resource = dataset.resource;

    const steps = parents.find(".resource-counter-step");
    const max = parseInt(dataset.max || actorData[resource].max);

    if (index < 0 || index > steps.length) {
      return;
    }

    if (oldState === "") {
      actorData.data[resource].full = Math.min(index + 1, max);
    } else {
      actorData.data[resource].full = Math.max(actorData.data[resource].full - 1, 0);
    } 

    this.actor.update(actorData);
  }

  _setupSquareCounters(html) {
    const actorData = duplicate(this.actor);

    html.find(".resource-counter").each(function () {
      const dataset = this.dataset;
      const state = dataset.state || "/";
      const resource = dataset.resource;
      const max = parseInt(dataset.max || actorData.data[resource].max);
      const full = parseInt(dataset.full || 0);

      const values = new Array(full);
      values.fill(state, 0, full);

      $(this)
        .find(".resource-counter-step")
        .each(function () {
          this.dataset.state = "";
          if (this.dataset.index < values.length) {
            this.dataset.state = values[this.dataset.index];
          }
        });
    });
  }

  _onResourceChange(event) {
    event.preventDefault();
    const actorData = duplicate(this.actor);
    const element = event.currentTarget;
    const dataset = element.dataset;
    const resource = dataset.resource;
    const max = parseInt(dataset.max || actorData.data[resource].max);

    if (dataset.action === "spend") {
      actorData.data[resource].full = Math.max(actorData.data[resource].full - 1, 0);
    } else if (dataset.action === "recover") {
      actorData.data[resource].full = Math.min(actorData.data[resource].full + 1, max);
    } else {
      return;
    }

    // TODO - Chat message

    this.actor.update(actorData);
  }
}