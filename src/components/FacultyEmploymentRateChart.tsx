import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid, 
  ReferenceLine, 
  Cell, 
  LabelList 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { FACULTY_ABBR_MAP } from '../data';

export interface FacultyEmploymentChartItem {
  abbr: string;
  facultyName: string;
  total: number;
  employed: number;
  unemployed: number;
  notSeeking: number;
  base: number;
  employedRate?: number;
  unemployedRate?: number;
  employedTotalRate?: number;
  unemployedTotalRate?: number;
  notSeekingTotalRate?: number;
  activeEmployedRate?: number;
  activeUnemployedRate?: number;
  activeNotSeekingRate?: number;
  rate: number;
  totalRate: number;
  activeRate: number;
  displayRate: string;
}

interface FacultyEmploymentRateChartProps {
  id?: string;
  data: FacultyEmploymentChartItem[];
  employmentRateCalculated: string;
  totalResponsesCount: number;
  empRateChartMode: 'base' | 'total';
  setEmpRateChartMode: (mode: 'base' | 'total') => void;
  title?: string;
  description?: string;
}

export const FACULTY_FULL_NAME_INDEX: Record<string, string> = {
  "TI": "คณะเทคโนโลยีสารสนเทศและนวัตกรรม",
  "EN": "คณะวิศวกรรมศาสตร์",
  "AC": "คณะบัญชี",
  "BA": "คณะบริหารธุรกิจ",
  "EC": "คณะเศรษฐศาสตร์และการลงทุน",
  "LA": "คณะนิติศาสตร์",
  "CA": "คณะนิเทศศาสตร์",
  "HTM": "คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว",
  "FA": "คณะศิลปกรรมศาสตร์",
  "AR": "คณะสถาปัตยกรรมศาสตร์",
  "SEM": "คณะการสร้างเจ้าของธุรกิจและการบริหารจัดการ (BUSEM)",
  "DC": "คณะดิจิทัลมีเดียและศิลปะภาพยนตร์",
  "BUI": "วิทยาลัยนานาชาติ (BUI)",
  "BUCI": "วิทยาลัยนานาชาติจีน (BUCI)"
};

export default function FacultyEmploymentRateChart({
  id = 'faculty-employment-comparison-chart',
  data,
  employmentRateCalculated,
  totalResponsesCount,
  empRateChartMode,
  setEmpRateChartMode,
  title = "กราฟแท่งเปรียบเทียบการมีงานทำในแต่ละคณะ (Faculty Employment Comparison)",
  description = "เปรียบเทียบร้อยละการมีงานทำและจำนวนผู้มีงานทำจำแนกตามรายคณะการศึกษาของมหาวิทยาลัยกรุงเทพ"
}: FacultyEmploymentRateChartProps) {
  // Chart Display Type: 'rate' = Percentage (%), 'compare' = Headcount Comparison (Employed vs Unemployed vs Others)
  const [chartType, setChartType] = useState<'rate' | 'compare'>('rate');
  // Sort Type: 'default' = TI, EN, AC... | 'rate_desc' = Highest Rate | 'total_desc' = Most Responses
  const [sortOrder, setSortOrder] = useState<'default' | 'rate_desc' | 'total_desc'>('default');
  // Hover or clicked highlight for a faculty
  const [highlightedAbbr, setHighlightedAbbr] = useState<string | null>(null);

  // Sorted data according to user selection
  const processedData = useMemo(() => {
    const list = data.map(item => {
      // Rates based on (employed + unemployed)
      const empRate = item.employedRate ?? (item.base > 0 ? Number(((item.employed / item.base) * 100).toFixed(1)) : 0);
      const unempRate = item.unemployedRate ?? (item.base > 0 ? Number(((item.unemployed / item.base) * 100).toFixed(1)) : 0);

      // Rates based on total respondents
      const empTotRate = item.employedTotalRate ?? (item.total > 0 ? Number(((item.employed / item.total) * 100).toFixed(1)) : 0);
      const unempTotRate = item.unemployedTotalRate ?? (item.total > 0 ? Number(((item.unemployed / item.total) * 100).toFixed(1)) : 0);
      const notSeekingTotRate = item.notSeekingTotalRate ?? (item.total > 0 ? Number(((item.notSeeking / item.total) * 100).toFixed(1)) : 0);

      const activeEmployedRate = empRateChartMode === 'base' ? empRate : empTotRate;
      const activeUnemployedRate = empRateChartMode === 'base' ? unempRate : unempTotRate;
      const activeNotSeekingRate = empRateChartMode === 'base' ? 0 : notSeekingTotRate;

      return {
        ...item,
        employedRate: empRate,
        unemployedRate: unempRate,
        employedTotalRate: empTotRate,
        unemployedTotalRate: unempTotRate,
        notSeekingTotalRate: notSeekingTotRate,
        activeEmployedRate,
        activeUnemployedRate,
        activeNotSeekingRate,
        activeRate: activeEmployedRate,
        displayRate: item.base > 0 || item.total > 0 ? `${activeEmployedRate}%` : '-'
      };
    });

    if (sortOrder === 'rate_desc') {
      return [...list].sort((a, b) => (b.activeEmployedRate ?? 0) - (a.activeEmployedRate ?? 0));
    }
    if (sortOrder === 'total_desc') {
      return [...list].sort((a, b) => b.total - a.total);
    }
    return list;
  }, [data, empRateChartMode, sortOrder]);

  // Find top performing faculty
  const topFaculty = useMemo(() => {
    const activeFaculties = processedData.filter(f => f.base > 0 || f.total > 0);
    if (activeFaculties.length === 0) return null;
    return [...activeFaculties].sort((a, b) => b.activeRate - a.activeRate)[0];
  }, [processedData]);

  // Count faculties with responses
  const activeFacultyCount = useMemo(() => {
    return processedData.filter(f => f.total > 0).length;
  }, [processedData]);

  return (
    <div id={id} className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200/90 shadow-xs space-y-6 font-sans">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs flex-shrink-0 animate-pulse"></span>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 tracking-tight">
              {title}
            </h3>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Real-time Live Sync</span>
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            {chartType === 'rate'
              ? 'แกนแนวตั้ง: ร้อยละ (%) รวม 1 แท่งซ้อน (มีงานทำ + ยังไม่มีงานทำ) | แกนแนวนอน: คณะการศึกษา (อักษรย่อ)'
              : 'แกนแนวตั้ง: จำนวนบัณฑิต (คน) | แกนแนวนอน: คณะการศึกษา (อักษรย่อ)'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Chart View Mode: Rate vs Comparison */}
          <div className="inline-flex bg-neutral-100/90 p-1 rounded-2xl text-xs font-bold border border-neutral-200/70">
            <button
              type="button"
              onClick={() => setChartType('rate')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartType === 'rate'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>กราฟร้อยละ (%)</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('compare')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                chartType === 'compare'
                  ? 'bg-white text-indigo-800 shadow-xs font-black'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>เปรียบเทียบจำนวนคน</span>
            </button>
          </div>

          {/* Sub-toggle for Rate mode */}
          {chartType === 'rate' && (
            <div className="inline-flex bg-neutral-100/90 p-1 rounded-2xl text-xs font-bold border border-neutral-200/70">
              <button
                type="button"
                onClick={() => setEmpRateChartMode('base')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  empRateChartMode === 'base'
                    ? 'bg-white text-emerald-700 shadow-xs font-black'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="คำนวณจาก: มีงานทำ / (มีงานทำ + ยังไม่มีงานทำ)"
              >
                ฐานผู้มีงานทำ/หางาน (%)
              </button>
              <button
                type="button"
                onClick={() => setEmpRateChartMode('total')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  empRateChartMode === 'total'
                    ? 'bg-white text-emerald-700 shadow-xs font-black'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="คำนวณจาก: มีงานทำ / ผู้ตอบแบบสำรวจทั้งหมด"
              >
                ฐานผู้ตอบทั้งหมด (%)
              </button>
            </div>
          )}

          {/* Sort Selector */}
          <div className="relative inline-flex items-center bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3 py-1 text-xs text-neutral-700 font-semibold shadow-2xs">
            <SlidersHorizontal className="w-3 h-3 text-neutral-500 mr-1.5" />
            <span className="text-neutral-400 mr-1 font-normal">เรียง:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-neutral-800 focus:outline-hidden cursor-pointer pr-3"
            >
              <option value="default">ลำดับรหัสคณะ (TI, EN, ...)</option>
              <option value="rate_desc">ร้อยละมีงานทำ (สูง ➔ ต่ำ)</option>
              <option value="total_desc">จำนวนผู้ตอบ (มาก ➔ น้อย)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Chart Graphic Canvas */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={processedData} 
            margin={{ top: 25, right: 15, left: -5, bottom: 25 }}
          >
            <defs>
              <linearGradient id="facBarGradEmployed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="facBarGradMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="facBarGradDeveloping" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis 
              dataKey="abbr" 
              stroke="#475569" 
              fontSize={11} 
              fontWeight={800} 
              tickLine={false} 
              axisLine={{ stroke: '#cbd5e1' }} 
              interval={0}
            />

            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              domain={chartType === 'rate' ? [0, 100] : [0, 'auto']}
              tickFormatter={(val) => chartType === 'rate' ? `${val}%` : `${val}`}
            />

            <Tooltip 
              cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as FacultyEmploymentChartItem;
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200/80 shadow-xl text-xs font-sans space-y-2.5 min-w-[240px]">
                      <div className="border-b border-neutral-100 pb-2">
                        <p className="font-extrabold text-neutral-900 text-sm leading-snug">{item.facultyName}</p>
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black mt-1">
                          อักษรย่อ: {item.abbr}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11.5px]">
                        <div className="flex justify-between items-center text-neutral-700 font-bold bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>ร้อยละการมีงานทำ:</span>
                          </span>
                          <span className="font-mono text-sm text-emerald-700 font-black">
                            {item.activeEmployedRate}% ({item.employed} คน)
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-neutral-700 font-bold bg-amber-50/80 p-2 rounded-xl border border-amber-100">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span>ร้อยละยังไม่มีงานทำ:</span>
                          </span>
                          <span className="font-mono text-sm text-amber-700 font-black">
                            {item.activeUnemployedRate}% ({item.unemployed} คน)
                          </span>
                        </div>

                        {(item.activeNotSeekingRate ?? 0) > 0 && (
                          <div className="flex justify-between items-center text-neutral-700 font-bold bg-purple-50/80 p-2 rounded-xl border border-purple-100">
                            <span className="flex items-center space-x-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                              <span>ศึกษาต่อ/อื่นๆ:</span>
                            </span>
                            <span className="font-mono text-sm text-purple-700 font-black">
                              {item.activeNotSeekingRate}% ({item.notSeeking} คน)
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-neutral-100 flex justify-between text-neutral-600 text-[11px] font-semibold">
                          <span>รวมตอบแบบสำรวจ:</span>
                          <span className="font-mono font-bold text-neutral-900">{item.total} คน</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* University Average Benchmark Reference Line (In Rate Mode) */}
            {chartType === 'rate' && (
              <ReferenceLine 
                y={Number(employmentRateCalculated) || 0} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ 
                  value: `เกณฑ์เฉลี่ยมีงานทำรวม ${employmentRateCalculated}%`, 
                  fill: '#dc2626', 
                  fontSize: 11, 
                  fontWeight: 800,
                  position: 'top'
                }} 
              />
            )}

            {/* RENDER MODE 1: 1 BAR STACKED RATE (EMPLOYED % + UNEMPLOYED %) */}
            {chartType === 'rate' ? (
              <>
                <Legend 
                  verticalAlign="top" 
                  height={42} 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '12px' }} 
                />
                
                {/* 1. ส่วนร้อยละการมีงานทำ (ล่าง) */}
                <Bar 
                  dataKey="activeEmployedRate" 
                  name="ร้อยละการมีงานทำ (%)" 
                  stackId="rateStack"
                  fill="#10b981" 
                  maxBarSize={48}
                >
                  <LabelList 
                    dataKey="activeEmployedRate" 
                    position="center" 
                    fill="#000000" 
                    fontSize={10.5} 
                    fontWeight={900} 
                    formatter={(val: number) => (val >= 6 ? `${val}%` : '')}
                  />
                  {processedData.map((entry, index) => {
                    const isHighlighted = highlightedAbbr === entry.abbr;
                    return (
                      <Cell 
                        key={`cell-emp-${index}`} 
                        fill={isHighlighted ? '#047857' : '#10b981'}
                        stroke={isHighlighted ? '#064e3b' : undefined}
                        strokeWidth={isHighlighted ? 2 : 0}
                        className="cursor-pointer transition-all duration-150"
                        onClick={() => setHighlightedAbbr(highlightedAbbr === entry.abbr ? null : entry.abbr)}
                      />
                    );
                  })}
                </Bar>

                {/* 2. ส่วนร้อยละยังไม่มีงานทำ (ซ้อนในแท่งเดียวกัน) */}
                <Bar 
                  dataKey="activeUnemployedRate" 
                  name="ร้อยละยังไม่มีงานทำ (%)" 
                  stackId="rateStack"
                  fill="#f59e0b" 
                  radius={empRateChartMode === 'base' ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList 
                    dataKey="activeUnemployedRate" 
                    position="center" 
                    fill="#000000" 
                    fontSize={10.5} 
                    fontWeight={900} 
                    formatter={(val: number) => (val >= 6 ? `${val}%` : '')}
                  />
                  {processedData.map((entry, index) => {
                    const isHighlighted = highlightedAbbr === entry.abbr;
                    return (
                      <Cell 
                        key={`cell-unemp-${index}`} 
                        fill={isHighlighted ? '#b45309' : '#f59e0b'}
                        stroke={isHighlighted ? '#78350f' : undefined}
                        strokeWidth={isHighlighted ? 2 : 0}
                        className="cursor-pointer transition-all duration-150"
                        onClick={() => setHighlightedAbbr(highlightedAbbr === entry.abbr ? null : entry.abbr)}
                      />
                    );
                  })}
                </Bar>

                {/* 3. ส่วนร้อยละศึกษาต่อ/อื่นๆ (ถ้าเลือกฐานผู้ตอบทั้งหมด) */}
                {empRateChartMode === 'total' && (
                  <Bar 
                    dataKey="activeNotSeekingRate" 
                    name="ร้อยละศึกษาต่อ/อื่นๆ (%)" 
                    stackId="rateStack"
                    fill="#8b5cf6" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    <LabelList 
                      dataKey="activeNotSeekingRate" 
                      position="center" 
                      fill="#000000" 
                      fontSize={10.5} 
                      fontWeight={900} 
                      formatter={(val: number) => (val >= 6 ? `${val}%` : '')}
                    />
                    {processedData.map((entry, index) => {
                      const isHighlighted = highlightedAbbr === entry.abbr;
                      return (
                        <Cell 
                          key={`cell-notseeking-${index}`} 
                          fill={isHighlighted ? '#5b21b6' : '#8b5cf6'}
                          stroke={isHighlighted ? '#3b0764' : undefined}
                          strokeWidth={isHighlighted ? 2 : 0}
                          className="cursor-pointer transition-all duration-150"
                          onClick={() => setHighlightedAbbr(highlightedAbbr === entry.abbr ? null : entry.abbr)}
                        />
                      );
                    })}
                  </Bar>
                )}
              </>
            ) : (
              /* RENDER MODE 2: HEADCOUNT COMPARISON BARS (EMPLOYED vs UNEMPLOYED vs NOT SEEKING) */
              <>
                <Legend 
                  verticalAlign="top" 
                  height={40} 
                  wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '10px' }} 
                />
                <Bar 
                  dataKey="employed" 
                  name="มีงานทำแล้ว (คน)" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                >
                  <LabelList 
                    dataKey="employed" 
                    position="top" 
                    fill="#065f46" 
                    fontSize={10} 
                    fontWeight={800} 
                    formatter={(val: number) => val > 0 ? val : ''}
                  />
                </Bar>
                <Bar 
                  dataKey="unemployed" 
                  name="ยังไม่มีงานทำ (คน)" 
                  fill="#f59e0b" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                >
                  <LabelList 
                    dataKey="unemployed" 
                    position="top" 
                    fill="#9a3412" 
                    fontSize={10} 
                    fontWeight={800} 
                    formatter={(val: number) => val > 0 ? val : ''}
                  />
                </Bar>
                <Bar 
                  dataKey="notSeeking" 
                  name="ศึกษาต่อ/อื่นๆ (คน)" 
                  fill="#8b5cf6" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                >
                  <LabelList 
                    dataKey="notSeeking" 
                    position="top" 
                    fill="#5b21b6" 
                    fontSize={10} 
                    fontWeight={800} 
                    formatter={(val: number) => val > 0 ? val : ''}
                  />
                </Bar>
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Summary Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center space-x-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider">คณะที่มีอัตรามีงานทำสูงสุด</p>
            <p className="font-extrabold text-sm text-emerald-950 truncate mt-0.5">
              {topFaculty ? `${topFaculty.abbr} - ${topFaculty.facultyName}` : '-'}
            </p>
            <p className="text-[11px] font-mono font-black text-emerald-700">
              {topFaculty ? `${topFaculty.activeRate}% (${topFaculty.employed}/${topFaculty.base || topFaculty.total} คน)` : '-'}
            </p>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 flex items-center space-x-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-rose-800 uppercase tracking-wider">เฉลี่ยรวมทั้งมหาวิทยาลัย</p>
            <p className="font-mono font-black text-lg text-rose-950 mt-0.5">
              {employmentRateCalculated}%
            </p>
            <p className="text-[10.5px] text-rose-700/80">เกณฑ์เปรียบเทียบมาตรฐานกลาง</p>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 flex items-center space-x-3 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-indigo-800 uppercase tracking-wider">คณะที่มีข้อมูลตอบกลับ</p>
            <p className="font-bold text-sm text-indigo-950 mt-0.5">
              {activeFacultyCount} <span className="font-normal text-xs text-indigo-700">จากทั้งหมด 14 คณะ</span>
            </p>
            <p className="text-[10.5px] text-indigo-600 font-mono font-bold">
              รวมผู้ตอบ {totalResponsesCount} คน (Real-time)
            </p>
          </div>
        </div>
      </div>

      {/* Faculty Abbreviation Index (Interactive Chips) */}
      <div className="pt-3 border-t border-neutral-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
          <p className="text-[11px] font-black text-neutral-500 uppercase tracking-wider flex items-center space-x-1.5">
            <span>ดรรชนีอักษรย่อคณะการศึกษา (FACULTY ABBREVIATION INDEX)</span>
            <span className="text-[10px] text-neutral-400 font-normal">(คลิกเพื่อไฮไลต์แท่งกราฟของคณะนั้น)</span>
          </p>
          {highlightedAbbr && (
            <button
              type="button"
              onClick={() => setHighlightedAbbr(null)}
              className="text-[10.5px] text-indigo-600 font-bold hover:underline cursor-pointer self-start"
            >
              ล้างการไฮไลต์
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {Object.entries(FACULTY_FULL_NAME_INDEX).map(([abbr, name]) => {
            const isHighlighted = highlightedAbbr === abbr;
            const facStat = processedData.find(d => d.abbr === abbr);
            const rateStr = facStat && (facStat.base > 0 || facStat.total > 0) ? `${facStat.activeRate}%` : '-';
            const countStr = facStat ? `${facStat.employed}/${facStat.total}` : '0/0';

            return (
              <button
                key={abbr}
                type="button"
                onClick={() => setHighlightedAbbr(isHighlighted ? null : abbr)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isHighlighted 
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300' 
                    : 'bg-neutral-50/80 hover:bg-neutral-100/90 border-neutral-200/70 text-neutral-800'
                }`}
                title={name}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-mono font-black text-xs px-1.5 py-0.5 rounded-md ${
                    isHighlighted ? 'bg-white/20 text-white' : 'bg-neutral-200/80 text-neutral-800'
                  }`}>
                    {abbr}
                  </span>
                  <span className={`font-mono font-extrabold text-[11px] ${
                    isHighlighted ? 'text-emerald-100' : 'text-emerald-700'
                  }`}>
                    {rateStr}
                  </span>
                </div>
                <p className={`text-[10px] line-clamp-2 mt-1 font-medium leading-snug ${
                  isHighlighted ? 'text-emerald-50' : 'text-neutral-600'
                }`}>
                  {name}
                </p>
                <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                  <span className={isHighlighted ? 'text-emerald-100 font-bold' : 'text-emerald-700 font-bold'}>
                    มี {facStat?.activeEmployedRate ?? 0}%
                  </span>
                  <span className={isHighlighted ? 'text-amber-200 font-bold' : 'text-amber-600 font-bold'}>
                    ว่าง {facStat?.activeUnemployedRate ?? 0}%
                  </span>
                </div>
                <span className={`text-[9px] font-mono mt-0.5 self-end ${
                  isHighlighted ? 'text-emerald-200' : 'text-neutral-400'
                }`}>
                  ตอบ {countStr} คน
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
