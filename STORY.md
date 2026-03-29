# Day036 Story — Choice Radar View 1

## Why
毎日使う小さな課題を、1ページで即解決できる形にしたかったため。

## Requirements
- Webブラウザだけで完結すること
- 1画面で主要操作が終わること
- GitHub Pagesで公開できること

## Design highlights
- Day036専用にテーマをseed固定して再生成時の見た目を安定化
- planning用途に寄せた単機能UIで迷いを減らす
- 出力をそのまま再利用できるテキスト構造
- Family: compare_choice
- Mechanic: compare
- Input/Output: slider_mix -> radar
- Audience Promise: confidence
- Publish Hook: 重み付き評価で候補案の順位変化を比較できる計算ツール。（話題:GitHub Trending (A） を visual_demo 角度で見せる
- Complexity Tier: large
- Selected components: none
- Complexity hint: Implement the locked brief with one clear hero interaction and keep the main screenshot readable.

## Trade-offs / Known issues
- ローカル保存機能は未実装
- 複雑な入力バリデーションは最小限

## Next ideas
- 履歴保存
- プリセット追加
- エクスポート形式拡張

## Social copy
Day036｜比較レーダー
2つの案の違いを見やすくするためのツールです。
