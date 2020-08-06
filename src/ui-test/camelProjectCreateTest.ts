import * as fs from 'fs';
import {
    ActivityBar,
    InputBox,
    QuickOpenBox,
    QuickPickItem,
    TreeItem,
    VSBrowser,
    WebDriver
} from 'vscode-extension-tester';
import { expect } from 'chai';
import {
    notificationExists,
    openCommandPrompt,
    removeFilePathRecursively,
    typeCommandConfirm,
    waitForQuickPick
} from './common/commonUtils';
import { ProjectInitializer } from './common/projectInitializerConstants';
let os = require('os');
let path = require('path');

const CAMEL_MISSIONS_EXPECTED = [
    'circuit-breaker', 'configmap', 'health-check', 'rest-http', 'istio-distributed-tracing'
];

const DIR = 'Fuse_Camel_TestFolder';
const RUNTIME_VERSION = 'fuse redhat750';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function testCreatingCamelProject() {

    describe('Verify Project initializer Camel/Fuse projects creation', async function () {

        let homedir: string;
        let inputBox: InputBox | QuickOpenBox;
        let driver: WebDriver;

        before(async function () {
            this.timeout(10000);
            homedir = os.homedir() + path.sep + DIR;
            driver = VSBrowser.instance.driver;
            if (!fs.existsSync(homedir)) {
                fs.mkdirSync(homedir);
            }
            await openCommandPrompt();
            const quick = await InputBox.create();
            await quick.setText('>Extest: Add Folder');
            await quick.confirm();
            let confirmedPrompt = await InputBox.create();
            await confirmedPrompt.setText(homedir);
            await confirmedPrompt.confirm();
        });

        for (const mission of CAMEL_MISSIONS_EXPECTED) {
            describe('Test creating Camel/Fuse project: ' + mission + ', runtime & version: ' + RUNTIME_VERSION, async function () {
                this.timeout(7000);

                before('Open command prompt', async function () {
                    inputBox = await openCommandPrompt().catch(() => expect.fail('Could not open command palette - timed out'));
                });

                after(async function () {
                    this.timeout(10000);
                    if (inputBox && await inputBox.isDisplayed()) {
                        await inputBox.cancel();
                    }
                    // delete created project - files from the folder
                    removeFilePathRecursively(homedir);
                    await new ActivityBar().getViewControl('Explorer').closeView();
                });

                it('Select camel project', async function () {
                    await typeCommandConfirm(`>${ProjectInitializer.PI_GENERAL.camel}`, QuickPickItem.prototype.getLabel);
                });

                it(`Select mission: ${mission}`, async function () {
                    inputBox = await InputBox.create();
                    expect(await inputBox.getPlaceHolder()).to.be.equal('Choose mission');
                    const quickPick = await waitForQuickPick({
                        input: inputBox,
                        quickPickText: mission,
                        quickPickGetter: QuickPickItem.prototype.getLabel,
                        timeout: 5000
                    }).catch(() => expect.fail(`Could not find mission: ${mission}`));
                    await quickPick.select();
                });

                it(`Select runtime version: ${RUNTIME_VERSION}`, async function () {
                    inputBox = await InputBox.create();
                    expect(await inputBox.getPlaceHolder()).to.be.equal('Choose runtime');
                    const quickPick = await waitForQuickPick({
                        input: inputBox,
                        quickPickText: RUNTIME_VERSION,
                        quickPickGetter: async function (this: QuickPickItem) { return `${await this.getLabel()} ${await this.getDescription()}`; },
                        timeout: 5000
                    }).catch(async (e) => expect.fail(`Could not find runtime version(${RUNTIME_VERSION}) for ${mission}. Error: ${e}`));
                    await quickPick.select();
                });

                it('Select default groupId', async function () {
                    inputBox = await InputBox.create();
                    expect(await inputBox.getPlaceHolder()).to.be.equal('Enter the group id');
                    await inputBox.confirm();
                });

                it('Select default artifactId', async function () {
                    inputBox = await InputBox.create();
                    expect(await inputBox.getPlaceHolder()).to.be.equal('Enter the artifact id');
                    await inputBox.confirm();
                });

                it('Select default version', async function () {
                    inputBox = await InputBox.create();
                    expect(await inputBox.getPlaceHolder()).to.be.equal('Enter the version');
                    await inputBox.confirm();
                });


                it('Select home directory', async function () {
                    inputBox = await InputBox.create();
                    expect(await inputBox.getPlaceHolder()).to.be.equal('Select the target workspace folder');
                    await inputBox.selectQuickPick(DIR);
                });

                it('Check notification', async function () {
                    this.timeout(12000);
                    // check the notification 'Project saved to ;
                    // on Windows seems the C: is translated to c: by VSCode so we can't check this part
                    const notification = await notificationExists('Project saved to ', 5000).catch((e) => expect.fail(`Could not find notification: ${e}`));
                    await notification.dismiss().catch((e) => `Could not dismiss notifications. Error: ${e}`);
                });

                it('Check if explorer contains created project', async function () {
                    // check explorer that it contains created project
                    const explorerView = await new ActivityBar().getViewControl('Explorer').openView();
                    const viewTab = await explorerView.getContent().getSection('Untitled (Workspace)');
                    await driver.wait(async () => {
                        const items = await viewTab.getVisibleItems() as TreeItem[];

                        for (const item of items) {
                            if (await item.getLabel() === 'pom.xml') {
                                return true;
                            }
                        }

                        return false;
                    }, 8000, 'Could not find pom.xml in file explorer.').catch(expect.fail);
                });
            });
        }
    });
}
