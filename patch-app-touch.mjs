import fs from 'node:fs';

const file = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/App.tsx', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replaceAll('\r\n', '\n');
function replaceOnce(before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`App touch patch target missing: ${label}`);
  source = source.slice(0, index) + after + source.slice(index + before.length);
}

replaceOnce(
  "    const next = dispatchModeRuntime(modeRuntime, { type: 'select-mode', mode }, { variables, ans, angleMode });",
  "    const next = dispatchModeRuntime(modeRuntime, { type: 'select-mode', mode }, { variables, ans, angleMode, exactAns, resultMode, numberFormat });",
  'main menu runtime context',
);
replaceOnce(
  `                    modeScreen={runtimeScreenView(modeRuntime)}
                    onExpressionChange={setExpr}`,
  `                    modeScreen={runtimeScreenView(modeRuntime)}
                    onExpressionChange={setExpr}
                    onMenuSelect={index => {
                      if (activeMenu === 'MAIN') confirmMenuMode(index);
                      else handleKeypress('append', String(index + 1));
                    }}
                    onModeScreenSelect={index => {
                      if (modeRuntime.screen.kind === 'menu') {
                        const start = Math.floor(modeRuntime.screen.selected / 5) * 5;
                        const option = modeRuntime.screen.options[start + index];
                        if (option) applyModeAction({ type: 'append', value: option.key });
                      }
                    }}`,
  'LCD touch callbacks',
);

fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
