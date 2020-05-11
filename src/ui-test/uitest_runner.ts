import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { ExTester } from 'vscode-extension-tester';
import { projectPath } from './package_data';
import { ReleaseQuality } from 'vscode-extension-tester/out/util/codeUtil';

const storageFolder = undefined;
const releaseType: ReleaseQuality = ReleaseQuality.Stable;
const extensionFolder = path.join(projectPath, '.test-extensions');

// latest version
const vscodeVersion = undefined;

async function main(): Promise<void> {
    // make sure extension folder is empty
    fsExtra.removeSync(extensionFolder);
    fsExtra.mkdirsSync(extensionFolder);

    const tester = new ExTester(storageFolder, releaseType, extensionFolder);
    
    await tester.downloadCode(vscodeVersion);
    await tester.downloadChromeDriver(vscodeVersion);
    await tester.installVsix();
    await tester.runTests('out/ui-test/allTestsSuite.js', vscodeVersion);
}

main();
