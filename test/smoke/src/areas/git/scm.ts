/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Viewlet } from '../workbench/viewlet';
import { Commands } from '../workbench/workbench';
import { IElement } from '../../vscode/driver';
import { findElement, findElements, Code } from '../../vscode/code';

const VIEWLET = 'div[id="workbench.view.scm"]';
const SCM_INPUT = `${VIEWLET} .scm-editor textarea`;
const SCM_RESOURCE = `${VIEWLET} .monaco-list-row > .resource`;
const SCM_RESOURCE_GROUP = `${VIEWLET} .monaco-list-row > .resource-group`;
const REFRESH_COMMAND = `div[id="workbench.parts.sidebar"] .actions-container a.action-label[title="Refresh"]`;
const COMMIT_COMMAND = `div[id="workbench.parts.sidebar"] .actions-container a.action-label[title="Commit"]`;
const SCM_RESOURCE_CLICK = (name: string) => `${SCM_RESOURCE} .monaco-icon-label[title*="${name}"] .label-name`;
const SCM_RESOURCE_ACTION_CLICK = (name: string, actionName: string) => `${SCM_RESOURCE} .monaco-icon-label[title*="${name}"] .actions .action-label[title="${actionName}"]`;
const SCM_RESOURCE_GROUP_COMMAND_CLICK = (name: string) => `${SCM_RESOURCE_GROUP} .actions .action-label[title="${name}"]`;

interface Change {
	name: string;
	type: string;
	actions: string[];
}

function toChange(element: IElement): Change {
	const name = findElement(element, e => /\blabel-name\b/.test(e.className))!;
	const type = element.attributes['data-tooltip'] || '';

	const actionElementList = findElements(element, e => /\baction-label\b/.test(e.className));
	const actions = actionElementList.map(e => e.attributes['title']);

	return {
		name: name.textContent || '',
		type,
		actions
	};
}


export class SCM extends Viewlet {

	constructor(code: Code, private commands: Commands) {
		super(code);
	}

	async openSCMViewlet(): Promise<any> {
		await this.commands.runCommand('workbench.view.scm');
		await this.code.waitForElement(SCM_INPUT);
	}

	async waitForChange(name: string, type?: string): Promise<void> {
		const func = (change: Change) => change.name === name && (!type || change.type === type);
		await this.code.waitForElements(SCM_RESOURCE, true, elements => elements.some(e => func(toChange(e))));
	}

	async refreshSCMViewlet(): Promise<any> {
		await this.code.waitAndClick(REFRESH_COMMAND);
	}

	async openChange(name: string): Promise<void> {
		await this.code.waitAndClick(SCM_RESOURCE_CLICK(name));
	}

	async stage(name: string): Promise<void> {
		await this.code.waitAndClick(SCM_RESOURCE_ACTION_CLICK(name, 'Stage Changes'));
	}

	async stageAll(): Promise<void> {
		await this.code.waitAndClick(SCM_RESOURCE_GROUP_COMMAND_CLICK('Stage All Changes'));
	}

	async unstage(name: string): Promise<void> {
		await this.code.waitAndClick(SCM_RESOURCE_ACTION_CLICK(name, 'Unstage Changes'));
	}

	async commit(message: string): Promise<void> {
		await this.code.waitAndClick(SCM_INPUT);
		await this.code.waitForActiveElement(SCM_INPUT);
		await this.code.waitForSetValue(SCM_INPUT, message);
		await this.code.waitAndClick(COMMIT_COMMAND);
	}
}