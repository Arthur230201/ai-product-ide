/**
 * 使用示例：生成完整的页面级 PRD 文档
 */

import { generatePageLevelPrd, generatePrdTableFromCode } from './codeToPrdTable';

// 示例 1: 只生成表格（原有功能）
const instructionCardCode = `
export function InstructionCard({
  title,
  status,
  name,
  date,
  sourceTags = [],
  showActionButton = false,
  onActionClick,
}: InstructionCardProps) {
  return (
    <div className="bg-white rounded-lg border">
      <h3 className="font-semibold">{title}</h3>
      <span className="bg-blue-50 text-blue-600 rounded">{status}</span>
      <div className="flex items-center gap-2">
        <User className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">{name}</span>
        <Calendar className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      {showActionButton && (
        <button onClick={onActionClick} className="text-blue-600">
          催办
        </button>
      )}
    </div>
  );
}
`;

// 只生成表格
const tableOnly = generatePrdTableFromCode(
  instructionCardCode,
  'InstructionCard.tsx',
  'InstructionCard'
);

// 示例 2: 生成完整的页面级 PRD（新功能）
const fullPageCode = `
export function InstructionExample() {
  const [searchValue, setSearchValue] = useState('');
  const [sortValue, setSortValue] = useState('latest');
  const instructions = [/* ... */];

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructionHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortValue={sortValue}
        onSortChange={setSortValue}
      />
      <div className="p-4 space-y-3">
        {instructions.map((instruction) => (
          <InstructionCard
            key={instruction.id}
            title={instruction.title}
            status={instruction.status}
            name={instruction.name}
            date={instruction.date}
            sourceTags={instruction.sourceTags}
            showActionButton={instruction.showActionButton}
            onActionClick={() => console.log('催办:', instruction.id)}
          />
        ))}
      </div>
    </div>
  );
}
`;

// 生成完整的页面级 PRD（包含5个部分）
const fullPrd = generatePageLevelPrd(
  fullPageCode,
  'InstructionExample.tsx',
  'InstructionExample',
  '指令流'
);

console.log(fullPrd);
