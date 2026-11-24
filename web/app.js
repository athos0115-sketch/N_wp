(function () {
  'use strict';

  const STORAGE_KEY = 'n_wp_auth_config_v1';

  const els = {
    appShell: document.getElementById('appShell'),
    topBarFocal: document.getElementById('topBarFocal'),
    workCardFocal: document.getElementById('workCardFocal'),
    liveEmberDot: document.getElementById('liveEmberDot'),
    bannerEmberDot: document.getElementById('bannerEmberDot'),
    syncMeta: document.getElementById('syncMeta'),
    toggleConfigBtn: document.getElementById('toggleConfigBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    errorToast: document.getElementById('errorToast'),
    alertBanner: document.getElementById('alertBanner'),
    alertBannerText: document.getElementById('alertBannerText'),
    alertBadge: document.getElementById('alertBadge'),
    valRemainingLeave: document.getElementById('valRemainingLeave'),
    valUsedLeave: document.getElementById('valUsedLeave'),
    valPendingDeadline: document.getElementById('valPendingDeadline'),
    valTargetMonth: document.getElementById('valTargetMonth'),
    valMtdOvertime: document.getElementById('valMtdOvertime'),
    valOtEfficiency: document.getElementById('valOtEfficiency'),
    valActualWork: document.getElementById('valActualWork'),
    pillT1: document.getElementById('pillT1'),
    pillT2: document.getElementById('pillT2'),
    pillT34: document.getElementById('pillT34'),
    valEstNetPay: document.getElementById('valEstNetPay'),
    valAprJunAvg: document.getElementById('valAprJunAvg'),
    valGradeThreshold: document.getElementById('valGradeThreshold'),
    valBaseSalarySub: document.getElementById('valBaseSalarySub'),
    chartViewport: document.getElementById('chartViewport'),
    trendChartSvg: document.getElementById('trendChartSvg'),
    chartGridGroup: document.getElementById('chartGridGroup'),
    chartAreaPath: document.getElementById('chartAreaPath'),
    chartLinePath: document.getElementById('chartLinePath'),
    chartHoverHairline: document.getElementById('chartHoverHairline'),
    chartPointsGroup: document.getElementById('chartPointsGroup'),
    chartTooltip: document.getElementById('chartTooltip'),
    chartEmptyState: document.getElementById('chartEmptyState'),
    chartAxisLabels: document.getElementById('chartAxisLabels'),
    chartYearTrack: document.getElementById('chartYearTrack'),
    segButtons: Array.from(document.querySelectorAll('.seg-btn[data-chart-metric]')),
    aiContextText: document.getElementById('aiContextText'),
    copyAiBtn: document.getElementById('copyAiBtn'),
    archiveCount: document.getElementById('archiveCount'),
    archiveTableBody: document.getElementById('archiveTableBody'),
    fifoCount: document.getElementById('fifoCount'),
    fifoTableBody: document.getElementById('fifoTableBody'),
    // View Switcher & Yearly Analysis
    viewTabButtons: Array.from(document.querySelectorAll('.seg-btn[data-view-tab]')),
    viewPeriodMeta: document.getElementById('viewPeriodMeta'),
    monthlyView: document.getElementById('monthlyView'),
    yearlyView: document.getElementById('yearlyView'),
    yearlyOverviewFocal: document.getElementById('yearlyOverviewFocal'),
    valYearlyPeriod: document.getElementById('valYearlyPeriod'),
    valTotalWorkHours: document.getElementById('valTotalWorkHours'),
    valTotalOtHours: document.getElementById('valTotalOtHours'),
    valTotalNetPay: document.getElementById('valTotalNetPay'),
    pillTotalMonths: document.getElementById('pillTotalMonths'),
    pillAvgMonthlyOt: document.getElementById('pillAvgMonthlyOt'),
    pillAvgOtEff: document.getElementById('pillAvgOtEff'),
    yearlyChartViewport: document.getElementById('yearlyChartViewport'),
    yearlyChartSvg: document.getElementById('yearlyChartSvg'),
    yearlyChartGridGroup: document.getElementById('yearlyChartGridGroup'),
    yearlyChartBarsGroup: document.getElementById('yearlyChartBarsGroup'),
    yearlyChartAreaPath: document.getElementById('yearlyChartAreaPath'),
    yearlyChartLinePath: document.getElementById('yearlyChartLinePath'),
    yearlyChartHoverHairline: document.getElementById('yearlyChartHoverHairline'),
    yearlyChartPointsGroup: document.getElementById('yearlyChartPointsGroup'),
    yearlyChartTooltip: document.getElementById('yearlyChartTooltip'),
    yearlyChartEmptyState: document.getElementById('yearlyChartEmptyState'),
    yearlyChartAxisLabels: document.getElementById('yearlyChartAxisLabels'),
    yearlySegButtons: Array.from(document.querySelectorAll('.seg-btn[data-yearly-metric]')),
    yearlyCountSub: document.getElementById('yearlyCountSub'),
    yearlyCardsGrid: document.getElementById('yearlyCardsGrid'),
    leaveCyclesTableBody: document.getElementById('leaveCyclesTableBody'),
    // Auth Lock Modal
    authBackdrop: document.getElementById('authBackdrop'),
    authForm: document.getElementById('authForm'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    authErrorBox: document.getElementById('authErrorBox'),
    apiUrlInput: document.getElementById('apiUrlInput'),
    pinInput: document.getElementById('pinInput'),
    unlockBtn: document.getElementById('unlockBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
  };

  let activeView = 'monthly';
  let activeChartMetric = 'net';
  let activeChartYear = 'all';
  let activeYearlyMetric = 'ot';
  let cachedArchiveRows = [];
  let cachedYearlySummary = null;
  let plottedPoints = [];
  let yearlyPlottedPoints = [];
  let isUnlocked = false;

  function loadAuthConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          apiUrl: String(parsed.apiUrl || '').trim(),
          secretKey: String(parsed.secretKey || '').trim(),
        };
      }
    } catch (_) {
      // ignore storage errors
    }
    return { apiUrl: '', secretKey: '' };
  }

  function saveAuthConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        apiUrl: String(cfg.apiUrl || '').trim(),
        secretKey: String(cfg.secretKey || '').trim(),
      }));
    } catch (_) {
      // ignore storage errors
    }
  }

  function clearAuthConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // ignore storage errors
    }
  }

  function hasValidConfig(cfg) {
    return validateHttpsUrl(cfg.apiUrl) && Boolean(cfg.secretKey);
  }

  function validateHttpsUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function showError(msg) {
    if (!msg) {
      els.errorToast.hidden = true;
      els.errorToast.textContent = '';
      return;
    }
    els.errorToast.textContent = msg;
    els.errorToast.hidden = false;
  }

  function showModalError(msg, highlightPin) {
    if (!msg) {
      els.authErrorBox.hidden = true;
      els.authErrorBox.textContent = '';
      els.pinInput.classList.remove('is-error');
      return;
    }
    els.authErrorBox.textContent = msg;
    els.authErrorBox.hidden = false;
    els.pinInput.classList.toggle('is-error', Boolean(highlightPin));
  }

  function openAuthModal(options) {
    const opts = options || {};
    const cfg = loadAuthConfig();
    els.apiUrlInput.value = cfg.apiUrl || '';
    els.pinInput.value = cfg.secretKey || '';

    const allowClose = Boolean(opts.allowClose && isUnlocked);
    els.closeModalBtn.hidden = !allowClose;
    els.logoutBtn.hidden = !cfg.apiUrl && !cfg.secretKey;

    showModalError(opts.errorMsg || '', Boolean(opts.highlightPin));

    els.authBackdrop.hidden = false;
    if (!isUnlocked) {
      els.appShell.classList.add('is-locked');
      els.appShell.setAttribute('aria-hidden', 'true');
    }

    if (opts.highlightPin) {
      els.pinInput.focus();
      els.pinInput.select();
    } else if (!els.apiUrlInput.value) {
      els.apiUrlInput.focus();
    } else {
      els.pinInput.focus();
    }
  }

  function closeAuthModal() {
    els.authBackdrop.hidden = true;
    els.appShell.classList.remove('is-locked');
    els.appShell.removeAttribute('aria-hidden');
    showModalError('', false);
  }

  function resetDashboardView() {
    isUnlocked = false;
    activeChartYear = 'all';
    cachedArchiveRows = [];
    cachedYearlySummary = null;
    plottedPoints = [];
    yearlyPlottedPoints = [];

    els.syncMeta.textContent = '인증 대기 중';
    els.viewPeriodMeta.textContent = '연결 대기 중';
    els.alertBanner.classList.remove('is-alert');
    els.alertBannerText.textContent = '연결 대기 중';
    els.alertBadge.textContent = '대기';

    els.valRemainingLeave.textContent = '-';
    els.valUsedLeave.textContent = '-';
    els.valPendingDeadline.textContent = '-';
    els.valPendingDeadline.classList.remove('is-warn');

    els.valTargetMonth.textContent = '-';
    els.valActualWork.textContent = '-';
    els.valMtdOvertime.textContent = '-';
    els.valMtdOvertime.classList.remove('is-alert');
    els.valOtEfficiency.textContent = '-';

    els.valEstNetPay.textContent = '-';
    els.valAprJunAvg.textContent = '-';
    els.valGradeThreshold.textContent = '-';
    els.valBaseSalarySub.textContent = '기본급 - 엔';

    updateTriggerPill(els.pillT1, 'T1 반차 기한', '대기');
    updateTriggerPill(els.pillT2, 'T2 4~6월 보수', '대기');
    updateTriggerPill(els.pillT34, 'T3/T4 연차·잔업', '대기');

    els.topBarFocal.setAttribute('data-thermal', 'calm');
    els.workCardFocal.setAttribute('data-thermal', 'calm');
    els.yearlyOverviewFocal.setAttribute('data-thermal', 'calm');
    els.liveEmberDot.setAttribute('data-thermal', 'calm');
    els.liveEmberDot.setAttribute('data-live', 'false');
    els.bannerEmberDot.setAttribute('data-thermal', 'calm');
    els.bannerEmberDot.setAttribute('data-live', 'false');

    els.aiContextText.textContent = '-';
    renderChartYearTrack();
    renderChart();
    renderArchiveTable([]);
    renderHalfLeaveTable([]);
    renderYearlyView(null);
  }

  async function fetchActiveData(cfgOverride) {
    const cfg = cfgOverride || loadAuthConfig();
    showError('');

    if (!hasValidConfig(cfg)) {
      resetDashboardView();
      openAuthModal({ allowClose: false });
      return;
    }

    els.syncMeta.textContent = 'API 인증 및 데이터 동기화 중';
    els.unlockBtn.disabled = true;

    try {
      const endpointUrl = new URL(cfg.apiUrl);
      endpointUrl.searchParams.set('key', cfg.secretKey);

      const res = await fetch(endpointUrl.toString(), { redirect: 'follow', cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} 응답 오류`);
      }

      const json = await res.json();
      if (json && json.error) {
        if (String(json.error).toLowerCase() === 'unauthorized') {
          resetDashboardView();
          openAuthModal({
            allowClose: false,
            highlightPin: true,
            errorMsg: 'Unauthorized: 비밀키(PIN)가 일치하지 않습니다. 다시 입력해 주세요',
          });
          return;
        }
        throw new Error(String(json.error));
      }

      isUnlocked = true;
      closeAuthModal();
      renderPayload(json);
    } catch (err) {
      if (!isUnlocked) {
        openAuthModal({
          allowClose: false,
          errorMsg: `연결 실패: ${err.message}`,
        });
      } else {
        showError(`동기화 실패: ${err.message}`);
      }
      els.syncMeta.textContent = '연결 오류';
    } finally {
      els.unlockBtn.disabled = false;
    }
  }

  function renderPayload(payload) {
    const dash = payload.dashboard || {};
    els.syncMeta.textContent = dash.syncInfo || 'Apps Script API 연결됨';

    const bannerText = String(dash.alertBanner || '정상 가동 중');
    const isAlert = bannerText.includes('GEMINI 상담 필요') || bannerText.includes('CONSULT GEMINI NOW');

    els.alertBanner.classList.toggle('is-alert', isAlert);
    els.alertBannerText.textContent = bannerText;
    els.alertBadge.textContent = isAlert ? '상담 필요' : '정상';

    const remNum = parseNumberLike(dash.remainingLeave);
    els.valRemainingLeave.textContent = remNum !== null ? `${remNum.toFixed(1)} 일` : String(dash.remainingLeave || '-');
    els.valUsedLeave.textContent = String(dash.usedLeaveSummary || '-');

    const pendingStr = String(dash.pendingHalfLeave || '없음');
    els.valPendingDeadline.textContent = pendingStr;
    els.valPendingDeadline.classList.toggle('is-warn', pendingStr.includes('D-'));

    const monthSummary = String(dash.targetMonthSummary || '-');
    const ymMatch = monthSummary.match(/^(\d{4}-\d{2})\s*\(([^)]+)\)/);
    els.valTargetMonth.textContent = ymMatch ? ymMatch[1] : monthSummary;
    els.valActualWork.textContent = ymMatch ? ymMatch[2] : '-';

    const otNum = parseNumberLike(dash.mtdOvertime);
    els.valMtdOvertime.textContent = otNum !== null ? `${otNum.toFixed(1)} 시간` : String(dash.mtdOvertime || '-');
    els.valMtdOvertime.classList.toggle('is-alert', otNum !== null && otNum > 35);

    const effNum = parseNumberLike(dash.otEfficiency);
    els.valOtEfficiency.textContent = effNum !== null ? `${formatInt(effNum)} 엔/h` : String(dash.otEfficiency || '-');

    els.valEstNetPay.textContent = formatYenValue(dash.estNetPay);
    els.valAprJunAvg.textContent = formatYenValue(dash.aprJunAvgPay);
    els.valGradeThreshold.textContent = formatYenValue(dash.gradeThreshold90);

    const rawArchiveRows = Array.isArray(payload.monthlyArchive) ? payload.monthlyArchive : [];
    const archiveRows = normalizeArchiveRows(rawArchiveRows);
    const latestArchive = archiveRows.length > 0 ? archiveRows[archiveRows.length - 1] : null;
    const latestBase = latestArchive
      ? parseNumberLike(pickField(latestArchive, ['기본급(엔)', 'Base Salary'], ''))
      : null;
    const activeBase = latestBase !== null
      ? latestBase
      : (payload.settings && payload.settings.baseSalary ? Number(payload.settings.baseSalary) : null);
    els.valBaseSalarySub.textContent = activeBase ? `기본급 ${formatInt(activeBase)} 엔` : '기본급 - 엔';

    const triggers = Array.isArray(dash.triggers) ? dash.triggers : [];
    updateTriggerPill(els.pillT1, 'T1 반차 기한', triggers[0] || '정상');
    updateTriggerPill(els.pillT2, 'T2 4~6월 보수', triggers[1] || '정상');
    updateTriggerPill(els.pillT34, 'T3/T4 연차·잔업', triggers[2] || '정상');

    let thermal = 'calm';
    if (isAlert || (otNum !== null && otNum > 35)) {
      thermal = 'peak';
    } else if (pendingStr.includes('D-') || (otNum !== null && otNum >= 25)) {
      thermal = 'active';
    }

    els.topBarFocal.setAttribute('data-thermal', thermal);
    els.workCardFocal.setAttribute('data-thermal', thermal);
    els.yearlyOverviewFocal.setAttribute('data-thermal', thermal);
    els.liveEmberDot.setAttribute('data-thermal', thermal);
    els.liveEmberDot.setAttribute('data-live', 'true');
    els.bannerEmberDot.setAttribute('data-thermal', isAlert ? 'peak' : thermal);
    els.bannerEmberDot.setAttribute('data-live', 'true');

    els.aiContextText.textContent = dash.aiContextBlock || '-';

    cachedArchiveRows = archiveRows;
    cachedYearlySummary = normalizeYearlySummary(payload.yearlySummary, archiveRows);
    const periodLabel = cachedYearlySummary && cachedYearlySummary.totals
      ? cachedYearlySummary.totals.periodLabel
      : '-';
    els.viewPeriodMeta.textContent = periodLabel && periodLabel !== '-' ? periodLabel : '데이터 연동됨';

    renderChartYearTrack();
    renderChart();
    renderArchiveTable(archiveRows);
    renderHalfLeaveTable(Array.isArray(payload.halfLeaveLog) ? payload.halfLeaveLog : []);
    renderYearlyView(cachedYearlySummary);
  }

  function updateTriggerPill(el, label, rawText) {
    const text = String(rawText || '대기');
    const isAlert = text.includes('경보') || text.toUpperCase().includes('ALERT');
    el.classList.toggle('is-alert', isAlert);
    const spans = el.querySelectorAll('span');
    spans[0].textContent = label;
    spans[1].textContent = isAlert ? '경보' : (text.includes('대기') ? '대기' : '정상');
  }

  function pickField(row, keys, fallback) {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    return fallback !== undefined ? fallback : '-';
  }

  function normalizeYmStr(raw) {
    const s = String(raw || '').trim();
    const m = s.match(/^(\d{4})\s*[-./年]\s*(\d{1,2})(?:\s*[-./月]\s*\d{1,2}\s*日?)?$/);
    if (!m) return s;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (y >= 2020 && y <= 2100 && mo >= 1 && mo <= 12) {
      return `${y}-${String(mo).padStart(2, '0')}`;
    }
    return s;
  }

  function normalizeArchiveRows(rawRows) {
    const byYm = {};
    (rawRows || []).forEach((r) => {
      const rawYm = pickField(r, ['대상 월', 'Month'], '');
      const ym = normalizeYmStr(rawYm);
      if (!/^\d{4}-\d{2}$/.test(ym)) return;
      const normalized = Object.assign({}, r, { '대상 월': ym });
      const prev = byYm[ym];
      if (!prev) {
        byYm[ym] = normalized;
      } else {
        const prevWork = parseNumberLike(pickField(prev, ['실근로(h)', 'Actual Work (h)'], '0')) || 0;
        const currWork = parseNumberLike(pickField(normalized, ['실근로(h)', 'Actual Work (h)'], '0')) || 0;
        const currSrc = String(pickField(normalized, ['소스'], '-'));
        const prevSrc = String(pickField(prev, ['소스'], '-'));
        if ((currWork > 0 && currSrc !== '-') && (prevWork === 0 || prevSrc === '-')) {
          byYm[ym] = normalized;
        }
      }
    });
    return Object.keys(byYm).sort().map((ym) => byYm[ym]);
  }

  /* ==========================================================================
     Darkroom Filament SVG Bezier Spline Chart
     ======================================================================== */
  function renderChartYearTrack() {
    if (!els.chartYearTrack) return;
    const years = Array.from(new Set(
      cachedArchiveRows
        .map((r) => String(pickField(r, ['대상 월', 'Month'], '')).slice(0, 4))
        .filter((y) => /^\d{4}$/.test(y))
    )).sort((a, b) => a.localeCompare(b));

    if (activeChartYear !== 'all' && years.indexOf(activeChartYear) === -1) {
      activeChartYear = 'all';
    }

    els.chartYearTrack.textContent = '';
    const options = [{ value: 'all', label: '전체' }].concat(
      years.map((yr) => ({ value: yr, label: `${yr}년` }))
    );

    options.forEach((opt) => {
      const btn = document.createElement('button');
      const isActive = opt.value === activeChartYear;
      btn.type = 'button';
      btn.className = `seg-btn${isActive ? ' is-active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('data-chart-year', opt.value);
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        if (activeChartYear === opt.value) return;
        activeChartYear = opt.value;
        renderChartYearTrack();
        renderChart();
      });
      els.chartYearTrack.appendChild(btn);
    });
  }

  function extractChartSeries(rows, metric, yearFilter) {
    const filtered = (!yearFilter || yearFilter === 'all')
      ? rows
      : rows.filter((r) => String(pickField(r, ['대상 월', 'Month'], '')).startsWith(`${yearFilter}-`));

    return filtered.map((r) => {
      const month = String(pickField(r, ['대상 월', 'Month'], '-'));
      const net = parseNumberLike(pickField(r, ['예상 실수령(엔)', 'Est. Net Pay'], '0')) || 0;
      const regOt = parseNumberLike(pickField(r, ['평일·토 잔업(h)', 'Reg/Sat OT (h)'], '0')) || 0;
      const sunOt = parseNumberLike(pickField(r, ['일요일 근무(h)', 'Sunday Work (h)'], '0')) || 0;
      const ot = Math.round((regOt + sunOt) * 10) / 10;
      const eff = parseNumberLike(pickField(r, ['잔업 효율(엔/h)', 'OT Eff (JPY/h)'], '0')) || 0;

      let value = net;
      let formatted = `${formatInt(net)} 엔`;
      if (metric === 'ot') {
        value = ot;
        formatted = `${ot.toFixed(1)} 시간`;
      } else if (metric === 'eff') {
        value = eff;
        formatted = `${formatInt(eff)} 엔/h`;
      }

      return { month, value, formatted, net, ot, eff };
    });
  }

  function buildSmoothSplinePath(pts) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function renderChart() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const series = extractChartSeries(cachedArchiveRows, activeChartMetric, activeChartYear);

    els.chartGridGroup.textContent = '';
    els.chartPointsGroup.textContent = '';
    els.chartAxisLabels.textContent = '';
    els.chartTooltip.hidden = true;
    els.chartHoverHairline.setAttribute('hidden', 'true');
    plottedPoints = [];

    if (series.length === 0) {
      els.chartAreaPath.setAttribute('d', '');
      els.chartLinePath.setAttribute('d', '');
      els.chartEmptyState.hidden = false;
      return;
    }

    els.chartEmptyState.hidden = true;

    const W = 640;
    const H = 200;
    const padL = 56;
    const padR = 20;
    const padT = 20;
    const padB = 18;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const vals = series.map((d) => d.value);
    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal * 0.85);
      maxVal = maxVal > 0 ? maxVal * 1.15 : 10;
    } else {
      const margin = (maxVal - minVal) * 0.18;
      minVal = Math.max(0, minVal - margin);
      maxVal = maxVal + margin;
    }

    [0, 0.5, 1].forEach((ratio) => {
      const y = padT + plotH * ratio;
      const gridVal = maxVal - (maxVal - minVal) * ratio;

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(padL));
      line.setAttribute('x2', String(W - padR));
      line.setAttribute('y1', y.toFixed(1));
      line.setAttribute('y2', y.toFixed(1));
      line.setAttribute('class', 'chart-grid-line');
      els.chartGridGroup.appendChild(line);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', String(padL - 8));
      label.setAttribute('y', (y + 4).toFixed(1));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('class', 'chart-grid-label');
      label.textContent = formatChartAxisValue(gridVal, activeChartMetric);
      els.chartGridGroup.appendChild(label);
    });

    plottedPoints = series.map((item, idx) => {
      const x = series.length === 1
        ? padL + plotW / 2
        : padL + (plotW * idx) / (series.length - 1);
      const normY = (item.value - minVal) / (maxVal - minVal);
      const y = padT + plotH * (1 - normY);
      return Object.assign({}, item, { x, y, index: idx });
    });

    const linePath = buildSmoothSplinePath(plottedPoints);
    els.chartLinePath.setAttribute('d', linePath);

    if (plottedPoints.length >= 2) {
      const baseLineY = (padT + plotH).toFixed(1);
      const first = plottedPoints[0];
      const last = plottedPoints[plottedPoints.length - 1];
      els.chartAreaPath.setAttribute(
        'd',
        `${linePath} L ${last.x.toFixed(1)} ${baseLineY} L ${first.x.toFixed(1)} ${baseLineY} Z`
      );
    } else {
      els.chartAreaPath.setAttribute('d', '');
    }

    const nodeRadius = plottedPoints.length > 18 ? '2.5' : '4';
    plottedPoints.forEach((pt) => {
      const halo = document.createElementNS(svgNS, 'circle');
      halo.setAttribute('cx', pt.x.toFixed(1));
      halo.setAttribute('cy', pt.y.toFixed(1));
      halo.setAttribute('r', '10');
      halo.setAttribute('class', 'chart-point-halo');
      halo.setAttribute('data-idx', String(pt.index));

      const node = document.createElementNS(svgNS, 'circle');
      node.setAttribute('cx', pt.x.toFixed(1));
      node.setAttribute('cy', pt.y.toFixed(1));
      node.setAttribute('r', nodeRadius);
      node.setAttribute('class', 'chart-point-node');
      node.setAttribute('data-idx', String(pt.index));

      els.chartPointsGroup.appendChild(halo);
      els.chartPointsGroup.appendChild(node);
    });

    renderChartAxisTicks(plottedPoints, W);
  }

  function renderChartAxisTicks(pts, svgWidth) {
    if (!pts || pts.length === 0) return;

    const appendTick = (labelText, xSvg) => {
      const pct = Math.min(95, Math.max(6, (xSvg / svgWidth) * 100));
      const tick = document.createElement('span');
      tick.className = 'chart-axis-tick';
      tick.style.left = `${pct.toFixed(2)}%`;
      tick.textContent = labelText;
      els.chartAxisLabels.appendChild(tick);
    };

    if (activeChartYear === 'all' && pts.length > 12) {
      // 전체 보기: UI 오버플로우 방지를 위해 연도(YYYY) 중앙 위치만 간결하게 표시
      const yearBuckets = {};
      pts.forEach((pt) => {
        const yr = pt.month.slice(0, 4);
        if (!yearBuckets[yr]) yearBuckets[yr] = [];
        yearBuckets[yr].push(pt.x);
      });
      Object.keys(yearBuckets).sort().forEach((yr) => {
        const xs = yearBuckets[yr];
        const midX = (xs[0] + xs[xs.length - 1]) / 2;
        appendTick(yr, midX);
      });
      return;
    }

    // 연도별 보기 (최대 12개월): 월 표기만 간결하게 표시
    pts.forEach((pt) => {
      const mPart = pt.month.slice(5, 7);
      const label = pts.length <= 6 ? `${Number(mPart)}월` : mPart;
      appendTick(label, pt.x);
    });
  }

  function formatChartAxisValue(val, metric) {
    if (metric === 'ot') return `${val.toFixed(1)}h`;
    if (val >= 10000) return `${Math.round(val / 1000)}k`;
    return `${Math.round(val)}`;
  }

  function highlightChartPoint(clientX) {
    if (plottedPoints.length === 0) return;
    const svgRect = els.trendChartSvg.getBoundingClientRect();
    if (!svgRect.width) return;

    const svgX = ((clientX - svgRect.left) / svgRect.width) * 640;
    let nearest = plottedPoints[0];
    let minDist = Math.abs(svgX - nearest.x);

    for (let i = 1; i < plottedPoints.length; i++) {
      const dist = Math.abs(svgX - plottedPoints[i].x);
      if (dist < minDist) {
        minDist = dist;
        nearest = plottedPoints[i];
      }
    }

    els.chartHoverHairline.setAttribute('x1', nearest.x.toFixed(1));
    els.chartHoverHairline.setAttribute('x2', nearest.x.toFixed(1));
    els.chartHoverHairline.setAttribute('y1', '14');
    els.chartHoverHairline.setAttribute('y2', '182');
    els.chartHoverHairline.removeAttribute('hidden');

    els.chartPointsGroup.querySelectorAll('.chart-point-halo, .chart-point-node').forEach((node) => {
      const isTarget = Number(node.getAttribute('data-idx')) === nearest.index;
      node.classList.toggle('is-active', isTarget);
    });

    els.chartTooltip.textContent = `${nearest.month} · ${nearest.formatted} (잔업 ${nearest.ot.toFixed(1)}h)`;
    els.chartTooltip.hidden = false;

    const vpRect = els.chartViewport.getBoundingClientRect();
    const rawLeftPx = (nearest.x / 640) * vpRect.width;
    const halfTip = els.chartTooltip.offsetWidth / 2;
    const clampedLeft = Math.min(
      Math.max(halfTip + 8, rawLeftPx),
      Math.max(halfTip + 8, vpRect.width - halfTip - 8)
    );
    els.chartTooltip.style.left = `${clampedLeft}px`;
  }

  function clearChartHighlight() {
    els.chartHoverHairline.setAttribute('hidden', 'true');
    els.chartTooltip.hidden = true;
    els.chartPointsGroup.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
  }

  /* ==========================================================================
     Tables
     ======================================================================== */
  function renderArchiveTable(rows) {
    els.archiveTableBody.textContent = '';
    els.archiveCount.textContent = `${rows.length}개월`;
    if (rows.length === 0) {
      els.archiveTableBody.appendChild(createEmptyRow(8, '월별 아카이브 데이터가 없습니다'));
      return;
    }

    rows.slice().reverse().forEach((r) => {
      const regOt = parseNumberLike(pickField(r, ['평일·토 잔업(h)', 'Reg/Sat OT (h)'], '0')) || 0;
      const sunOt = parseNumberLike(pickField(r, ['일요일 근무(h)', 'Sunday Work (h)'], '0')) || 0;
      const totalOt = (regOt + sunOt).toFixed(1);

      const grossVal = pickField(r, ['과세 총지급(엔)', 'Taxable Gross'], '');
      const netVal = pickField(r, ['예상 실수령(엔)', 'Est. Net Pay'], '');
      const effVal = pickField(r, ['잔업 효율(엔/h)', 'OT Eff (JPY/h)'], '');
      const verifyText = String(pickField(r, ['월집계 검증', 'Verify vs 月集計'], '-'));
      const lockText = String(pickField(r, ['잠금 상태'], '집계중'));

      const tr = document.createElement('tr');
      appendCell(tr, pickField(r, ['대상 월', 'Month']));
      appendCell(tr, pickField(r, ['실근로(h)', 'Actual Work (h)']));
      appendCell(tr, totalOt);
      appendCell(tr, grossVal ? `${grossVal} 엔` : '-');
      appendCell(tr, netVal ? `${netVal} 엔` : '-');
      appendCell(tr, effVal ? `${effVal} 엔` : '-');

      const verifyTd = document.createElement('td');
      const vBadge = document.createElement('span');
      const isOk = verifyText === '정상' || verifyText === 'OK' || verifyText === '구양식 정상' || verifyText === '구양식 자동산출';
      vBadge.className = `status-tag ${isOk ? 'is-ok' : 'is-warn'}`;
      vBadge.textContent = verifyText;
      verifyTd.appendChild(vBadge);
      tr.appendChild(verifyTd);

      const lockTd = document.createElement('td');
      const lBadge = document.createElement('span');
      lBadge.className = `status-tag ${lockText === '확정' ? 'is-ok' : 'is-warn'}`;
      lBadge.textContent = lockText;
      lockTd.appendChild(lBadge);
      tr.appendChild(lockTd);

      els.archiveTableBody.appendChild(tr);
    });
  }

  function renderHalfLeaveTable(rows) {
    els.fifoTableBody.textContent = '';
    els.fifoCount.textContent = `${rows.length}건`;
    if (rows.length === 0) {
      els.fifoTableBody.appendChild(createEmptyRow(6, '반차 FIFO 이력이 없습니다'));
      return;
    }

    rows.slice().reverse().forEach((r) => {
      const tr = document.createElement('tr');
      appendCell(tr, pickField(r, ['사용일', 'Leave Date']));
      appendCell(tr, pickField(r, ['2개월 만료일', '2M Deadline']));

      const statusTd = document.createElement('td');
      const status = String(pickField(r, ['FIFO 상태', 'FIFO Status'], '-'));
      const badge = document.createElement('span');
      let tagClass = 'is-ok';
      if (status === '기한 만료' || status === 'EXPIRED') tagClass = 'is-alert';
      else if (status === '매칭 대기' || status === 'PENDING') tagClass = 'is-warn';
      badge.className = `status-tag ${tagClass}`;
      badge.textContent = status;
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      appendCell(tr, pickField(r, ['매칭일', 'Paired Date']));
      appendCell(tr, pickField(r, ['잔여 기한', 'D-Day']));
      appendCell(tr, pickField(r, ['급여 반영', 'Payroll Impact']));

      els.fifoTableBody.appendChild(tr);
    });
  }

  function appendCell(tr, text) {
    const td = document.createElement('td');
    td.textContent = String(text);
    tr.appendChild(td);
  }

  function createEmptyRow(colSpan, msg) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.textContent = msg;
    tr.appendChild(td);
    return tr;
  }

  function parseNumberLike(val) {
    if (typeof val === 'number' && !isNaN(val)) return val;
    const cleaned = String(val || '').replace(/[^0-9.\-]/g, '');
    if (!cleaned) return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  function formatInt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function formatYenValue(val) {
    const num = parseNumberLike(val);
    if (num !== null) return `${formatInt(num)} 엔`;
    return String(val || '-');
  }

  /* ==========================================================================
     Yearly Analysis View (2022 ~ Present)
     ======================================================================== */
  function normalizeYearlySummary(apiYearly, archiveRows) {
    if (apiYearly && Array.isArray(apiYearly.byYear)) {
      return apiYearly;
    }

    // 폴백: 구버전 API 응답 수신 시 monthlyArchive로부터 연도별 집계 자동 도출
    const rows = Array.isArray(archiveRows) ? archiveRows : [];
    const byYearMap = {};
    rows.forEach((r) => {
      const ym = String(pickField(r, ['대상 월', 'Month'], '')).trim();
      if (!/^\d{4}-\d{2}$/.test(ym)) return;
      const yr = ym.slice(0, 4);
      if (!byYearMap[yr]) {
        byYearMap[yr] = {
          year: yr,
          monthsCount: 0,
          totalWorkHours: 0,
          totalOtHours: 0,
          maxOtMonth: '-',
          maxOtHours: -1,
          baseSalary: 0,
          salaryNote: '',
          totalTaxableGross: 0,
          totalNetPay: 0,
          totalBaseOnlyNetPay: 0,
        };
      }
      const b = byYearMap[yr];
      const workH = parseNumberLike(pickField(r, ['실근로(h)', 'Actual Work (h)'], '0')) || 0;
      const regOt = parseNumberLike(pickField(r, ['평일·토 잔업(h)', 'Reg/Sat OT (h)'], '0')) || 0;
      const sunOt = parseNumberLike(pickField(r, ['일요일 근무(h)', 'Sunday Work (h)'], '0')) || 0;
      const otH = Math.round((regOt + sunOt) * 100) / 100;
      const baseSal = parseNumberLike(pickField(r, ['기본급(엔)', 'Base Salary'], '0')) || 0;
      const gross = parseNumberLike(pickField(r, ['과세 총지급(엔)', 'Taxable Gross'], '0')) || 0;
      const net = parseNumberLike(pickField(r, ['예상 실수령(엔)', 'Est. Net Pay'], '0')) || 0;
      const baseOnly = parseNumberLike(pickField(r, ['기본급 기준 실수령(엔)'], '0')) || 0;

      b.monthsCount += 1;
      b.totalWorkHours = Math.round((b.totalWorkHours + workH) * 100) / 100;
      b.totalOtHours = Math.round((b.totalOtHours + otH) * 100) / 100;
      b.baseSalary = baseSal || b.baseSalary;
      b.totalTaxableGross += gross;
      b.totalNetPay += net;
      b.totalBaseOnlyNetPay += baseOnly;
      if (otH > b.maxOtHours) {
        b.maxOtHours = otH;
        b.maxOtMonth = ym;
      }
    });

    const years = Object.keys(byYearMap).sort();
    const byYear = years.map((yr) => {
      const b = byYearMap[yr];
      return {
        year: yr,
        monthsCount: b.monthsCount,
        totalWorkHours: b.totalWorkHours,
        totalOtHours: b.totalOtHours,
        avgMonthlyOtHours: b.monthsCount > 0 ? Math.round((b.totalOtHours / b.monthsCount) * 100) / 100 : 0,
        maxOtMonth: b.maxOtHours >= 0 ? b.maxOtMonth : '-',
        maxOtHours: b.maxOtHours >= 0 ? b.maxOtHours : 0,
        baseSalary: b.baseSalary,
        salaryNote: '',
        totalTaxableGross: Math.round(b.totalTaxableGross),
        totalNetPay: Math.round(b.totalNetPay),
        avgOtEfficiency: b.totalOtHours > 0
          ? Math.round((b.totalNetPay - b.totalBaseOnlyNetPay) / b.totalOtHours)
          : 0,
      };
    });

    const totalMonths = byYear.reduce((s, y) => s + y.monthsCount, 0);
    const totalWorkHours = Math.round(byYear.reduce((s, y) => s + y.totalWorkHours, 0) * 100) / 100;
    const totalOtHours = Math.round(byYear.reduce((s, y) => s + y.totalOtHours, 0) * 100) / 100;
    const totalNetPay = byYear.reduce((s, y) => s + y.totalNetPay, 0);
    const firstYm = rows.length > 0 ? String(pickField(rows[0], ['대상 월', 'Month'], '-')) : '-';
    const lastYm = rows.length > 0 ? String(pickField(rows[rows.length - 1], ['대상 월', 'Month'], '-')) : '-';

    return {
      byYear,
      leaveCycles: [],
      totals: {
        periodLabel: rows.length > 0 ? `${firstYm} ~ ${lastYm}` : '-',
        totalMonths,
        totalWorkHours,
        totalOtHours,
        avgMonthlyOtHours: totalMonths > 0 ? Math.round((totalOtHours / totalMonths) * 100) / 100 : 0,
        totalNetPay,
        avgOtEfficiency: 0,
      },
    };
  }

  function switchView(nextView) {
    activeView = nextView === 'yearly' ? 'yearly' : 'monthly';
    const isYearly = activeView === 'yearly';

    els.monthlyView.hidden = isYearly;
    els.yearlyView.hidden = !isYearly;

    els.viewTabButtons.forEach((btn) => {
      const isActive = btn.getAttribute('data-view-tab') === activeView;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    clearChartHighlight();
    clearYearlyChartHighlight();
    if (isYearly) {
      renderYearlyChart();
    } else {
      renderChart();
    }
  }

  function renderYearlyView(yearlySummary) {
    const totals = yearlySummary && yearlySummary.totals ? yearlySummary.totals : null;
    const byYear = yearlySummary && Array.isArray(yearlySummary.byYear) ? yearlySummary.byYear : [];
    const leaveCycles = yearlySummary && Array.isArray(yearlySummary.leaveCycles) ? yearlySummary.leaveCycles : [];

    if (!totals || byYear.length === 0) {
      els.valYearlyPeriod.textContent = '-';
      els.valTotalWorkHours.textContent = '-';
      els.valTotalOtHours.textContent = '-';
      els.valTotalNetPay.textContent = '-';
      els.pillTotalMonths.textContent = '-';
      els.pillAvgMonthlyOt.textContent = '-';
      els.pillAvgOtEff.textContent = '-';
      els.yearlyCountSub.textContent = '0개년';
      renderYearlyChart();
      renderYearlyCards([]);
      renderLeaveCyclesTable([]);
      return;
    }

    els.valYearlyPeriod.textContent = totals.periodLabel || '-';
    els.valTotalWorkHours.textContent = `${Number(totals.totalWorkHours || 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 시간`;
    els.valTotalOtHours.textContent = `${Number(totals.totalOtHours || 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 시간`;
    els.valTotalNetPay.textContent = `${formatInt(totals.totalNetPay || 0)} 엔`;
    els.pillTotalMonths.textContent = `${totals.totalMonths || 0}개월`;
    els.pillAvgMonthlyOt.textContent = `${Number(totals.avgMonthlyOtHours || 0).toFixed(1)} h/월`;
    els.pillAvgOtEff.textContent = `${formatInt(totals.avgOtEfficiency || 0)} 엔/h`;
    els.yearlyCountSub.textContent = `${byYear.length}개년`;

    renderYearlyChart();
    renderYearlyCards(byYear);
    renderLeaveCyclesTable(leaveCycles);
  }

  function extractYearlySeries(byYear, metric) {
    return byYear.map((y) => {
      const totalOt = Number(y.totalOtHours) || 0;
      const totalWork = Number(y.totalWorkHours) || 0;
      const avgOt = Number(y.avgMonthlyOtHours) || 0;
      const totalNet = Number(y.totalNetPay) || 0;

      let value = totalOt;
      let formatted = `${totalOt.toFixed(1)} 시간`;
      if (metric === 'work') {
        value = totalWork;
        formatted = `${totalWork.toFixed(1)} 시간`;
      } else if (metric === 'avgOt') {
        value = avgOt;
        formatted = `${avgOt.toFixed(1)} h/월`;
      } else if (metric === 'net') {
        value = totalNet;
        formatted = `${formatInt(totalNet)} 엔`;
      }

      return {
        year: String(y.year),
        monthsCount: Number(y.monthsCount) || 0,
        maxOtMonth: y.maxOtMonth || '-',
        maxOtHours: Number(y.maxOtHours) || 0,
        totalOt,
        totalWork,
        value,
        formatted,
      };
    });
  }

  function formatYearlyAxisValue(val, metric) {
    if (metric === 'net') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${Math.round(val / 1000)}k`;
      return `${Math.round(val)}`;
    }
    return `${Math.round(val)}h`;
  }

  function renderYearlyChart() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const byYear = cachedYearlySummary && Array.isArray(cachedYearlySummary.byYear)
      ? cachedYearlySummary.byYear
      : [];
    const series = extractYearlySeries(byYear, activeYearlyMetric);

    els.yearlyChartGridGroup.textContent = '';
    els.yearlyChartBarsGroup.textContent = '';
    els.yearlyChartPointsGroup.textContent = '';
    els.yearlyChartAxisLabels.textContent = '';
    els.yearlyChartTooltip.hidden = true;
    els.yearlyChartHoverHairline.setAttribute('hidden', 'true');
    yearlyPlottedPoints = [];

    if (series.length === 0) {
      els.yearlyChartAreaPath.setAttribute('d', '');
      els.yearlyChartLinePath.setAttribute('d', '');
      els.yearlyChartEmptyState.hidden = false;
      return;
    }

    els.yearlyChartEmptyState.hidden = true;

    const W = 640;
    const H = 200;
    const padL = 56;
    const padR = 24;
    const padT = 20;
    const padB = 18;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const baseLineY = padT + plotH;

    const vals = series.map((d) => d.value);
    const maxRaw = Math.max(...vals);
    const maxVal = maxRaw > 0 ? maxRaw * 1.18 : 10;
    const minVal = 0;

    [0, 0.5, 1].forEach((ratio) => {
      const y = padT + plotH * ratio;
      const gridVal = maxVal - (maxVal - minVal) * ratio;

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(padL));
      line.setAttribute('x2', String(W - padR));
      line.setAttribute('y1', y.toFixed(1));
      line.setAttribute('y2', y.toFixed(1));
      line.setAttribute('class', 'chart-grid-line');
      els.yearlyChartGridGroup.appendChild(line);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', String(padL - 8));
      label.setAttribute('y', (y + 4).toFixed(1));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('class', 'chart-grid-label');
      label.textContent = formatYearlyAxisValue(gridVal, activeYearlyMetric);
      els.yearlyChartGridGroup.appendChild(label);
    });

    const slotW = plotW / series.length;
    const barW = Math.min(44, Math.max(18, slotW * 0.38));

    yearlyPlottedPoints = series.map((item, idx) => {
      const x = series.length === 1
        ? padL + plotW / 2
        : padL + slotW * idx + slotW / 2;
      const normY = (item.value - minVal) / (maxVal - minVal);
      const y = padT + plotH * (1 - normY);
      return Object.assign({}, item, { x, y, index: idx });
    });

    yearlyPlottedPoints.forEach((pt) => {
      const barH = Math.max(2, baseLineY - pt.y);
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', (pt.x - barW / 2).toFixed(1));
      rect.setAttribute('y', pt.y.toFixed(1));
      rect.setAttribute('width', barW.toFixed(1));
      rect.setAttribute('height', barH.toFixed(1));
      rect.setAttribute('rx', '4');
      rect.setAttribute('class', 'yearly-bar');
      rect.setAttribute('data-idx', String(pt.index));
      els.yearlyChartBarsGroup.appendChild(rect);
    });

    const linePath = buildSmoothSplinePath(yearlyPlottedPoints);
    els.yearlyChartLinePath.setAttribute('d', linePath);

    if (yearlyPlottedPoints.length >= 2) {
      const first = yearlyPlottedPoints[0];
      const last = yearlyPlottedPoints[yearlyPlottedPoints.length - 1];
      els.yearlyChartAreaPath.setAttribute(
        'd',
        `${linePath} L ${last.x.toFixed(1)} ${baseLineY.toFixed(1)} L ${first.x.toFixed(1)} ${baseLineY.toFixed(1)} Z`
      );
    } else {
      els.yearlyChartAreaPath.setAttribute('d', '');
    }

    yearlyPlottedPoints.forEach((pt) => {
      const halo = document.createElementNS(svgNS, 'circle');
      halo.setAttribute('cx', pt.x.toFixed(1));
      halo.setAttribute('cy', pt.y.toFixed(1));
      halo.setAttribute('r', '10');
      halo.setAttribute('class', 'chart-point-halo');
      halo.setAttribute('data-idx', String(pt.index));

      const node = document.createElementNS(svgNS, 'circle');
      node.setAttribute('cx', pt.x.toFixed(1));
      node.setAttribute('cy', pt.y.toFixed(1));
      node.setAttribute('r', '4');
      node.setAttribute('class', 'chart-point-node');
      node.setAttribute('data-idx', String(pt.index));

      els.yearlyChartPointsGroup.appendChild(halo);
      els.yearlyChartPointsGroup.appendChild(node);

      const span = document.createElement('span');
      span.textContent = `${pt.year} (${pt.monthsCount}개월)`;
      els.yearlyChartAxisLabels.appendChild(span);
    });
  }

  function highlightYearlyChartPoint(clientX) {
    if (yearlyPlottedPoints.length === 0) return;
    const svgRect = els.yearlyChartSvg.getBoundingClientRect();
    if (!svgRect.width) return;

    const svgX = ((clientX - svgRect.left) / svgRect.width) * 640;
    let nearest = yearlyPlottedPoints[0];
    let minDist = Math.abs(svgX - nearest.x);

    for (let i = 1; i < yearlyPlottedPoints.length; i++) {
      const dist = Math.abs(svgX - yearlyPlottedPoints[i].x);
      if (dist < minDist) {
        minDist = dist;
        nearest = yearlyPlottedPoints[i];
      }
    }

    els.yearlyChartHoverHairline.setAttribute('x1', nearest.x.toFixed(1));
    els.yearlyChartHoverHairline.setAttribute('x2', nearest.x.toFixed(1));
    els.yearlyChartHoverHairline.setAttribute('y1', '14');
    els.yearlyChartHoverHairline.setAttribute('y2', '182');
    els.yearlyChartHoverHairline.removeAttribute('hidden');

    els.yearlyChartBarsGroup.querySelectorAll('.yearly-bar').forEach((bar) => {
      bar.classList.toggle('is-active', Number(bar.getAttribute('data-idx')) === nearest.index);
    });
    els.yearlyChartPointsGroup.querySelectorAll('.chart-point-halo, .chart-point-node').forEach((node) => {
      node.classList.toggle('is-active', Number(node.getAttribute('data-idx')) === nearest.index);
    });

    els.yearlyChartTooltip.textContent = `${nearest.year}년 · ${nearest.formatted} (최대 ${nearest.maxOtMonth})`;
    els.yearlyChartTooltip.hidden = false;

    const vpRect = els.yearlyChartViewport.getBoundingClientRect();
    const rawLeftPx = (nearest.x / 640) * vpRect.width;
    const halfTip = els.yearlyChartTooltip.offsetWidth / 2;
    const clampedLeft = Math.min(
      Math.max(halfTip + 8, rawLeftPx),
      Math.max(halfTip + 8, vpRect.width - halfTip - 8)
    );
    els.yearlyChartTooltip.style.left = `${clampedLeft}px`;
  }

  function clearYearlyChartHighlight() {
    els.yearlyChartHoverHairline.setAttribute('hidden', 'true');
    els.yearlyChartTooltip.hidden = true;
    els.yearlyChartBarsGroup.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
    els.yearlyChartPointsGroup.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
  }

  function renderYearlyCards(byYear) {
    els.yearlyCardsGrid.textContent = '';
    if (!byYear || byYear.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'yearly-empty-state';
      empty.textContent = '연도별 요약 데이터가 없습니다';
      els.yearlyCardsGrid.appendChild(empty);
      return;
    }

    byYear.forEach((y) => {
      const card = document.createElement('article');
      card.className = 'year-card';

      const header = document.createElement('div');
      header.className = 'year-card-header';

      const titleGroup = document.createElement('div');
      titleGroup.className = 'year-card-title-group';

      const yearTitle = document.createElement('strong');
      yearTitle.className = 'year-card-year';
      yearTitle.textContent = `${y.year}년`;

      const monthsSpan = document.createElement('span');
      monthsSpan.className = 'year-card-months';
      monthsSpan.textContent = `${y.monthsCount}개월`;

      titleGroup.appendChild(yearTitle);
      titleGroup.appendChild(monthsSpan);

      const isEstimate = String(y.salaryNote || '').includes('추정');
      const salBadge = document.createElement('span');
      salBadge.className = `status-tag ${isEstimate ? 'is-warn' : 'is-ok'}`;
      salBadge.textContent = `기본급 ${formatInt(y.baseSalary || 0)}엔${isEstimate ? ' (추정)' : ''}`;

      header.appendChild(titleGroup);
      header.appendChild(salBadge);
      card.appendChild(header);

      const stats = document.createElement('div');
      stats.className = 'year-card-stats';

      const items = [
        { label: '총 실근로', val: `${Number(y.totalWorkHours || 0).toFixed(1)}h`, gold: false },
        { label: '총 잔업', val: `${Number(y.totalOtHours || 0).toFixed(1)}h`, gold: true },
        { label: '월평균 잔업', val: `${Number(y.avgMonthlyOtHours || 0).toFixed(1)}h`, gold: false },
        { label: '최대 잔업월', val: y.maxOtMonth !== '-' ? `${y.maxOtMonth} (${Number(y.maxOtHours || 0).toFixed(1)}h)` : '-', gold: false },
        { label: '추정 실수령 합계', val: `${formatInt(y.totalNetPay || 0)}엔`, gold: true },
        { label: '평균 잔업효율', val: `${formatInt(y.avgOtEfficiency || 0)}엔/h`, gold: false },
      ];

      items.forEach((it) => {
        const box = document.createElement('div');
        box.className = 'year-stat';
        const lbl = document.createElement('span');
        lbl.className = 'year-stat-label';
        lbl.textContent = it.label;
        const val = document.createElement('strong');
        val.className = `year-stat-val${it.gold ? ' is-gold' : ''}`;
        val.textContent = it.val;
        box.appendChild(lbl);
        box.appendChild(val);
        stats.appendChild(box);
      });

      card.appendChild(stats);
      els.yearlyCardsGrid.appendChild(card);
    });
  }

  function renderLeaveCyclesTable(cycles) {
    els.leaveCyclesTableBody.textContent = '';
    if (!cycles || cycles.length === 0) {
      els.leaveCyclesTableBody.appendChild(createEmptyRow(7, '연차 사이클 이력이 없습니다'));
      return;
    }

    cycles.forEach((c) => {
      const tr = document.createElement('tr');
      appendCell(tr, c.cycleLabel || '-');
      appendCell(tr, `${Number(c.fullLeaveDays || 0).toFixed(1)}일`);
      appendCell(tr, `${Number(c.halfLeaveCount || 0)}회`);
      appendCell(tr, `${Number(c.pairedPairs || 0)}쌍`);

      const expTd = document.createElement('td');
      const expCount = Number(c.expiredHalfCount || 0);
      const expBadge = document.createElement('span');
      expBadge.className = `status-tag ${expCount > 0 ? 'is-alert' : 'is-ok'}`;
      expBadge.textContent = `${expCount}회`;
      expTd.appendChild(expBadge);
      tr.appendChild(expTd);

      appendCell(tr, `${Number(c.officialUsedLeave || 0).toFixed(1)}일`);

      const statusTd = document.createElement('td');
      const statusText = String(c.statusLabel || '-');
      const statusBadge = document.createElement('span');
      statusBadge.className = `status-tag ${statusText.includes('진행중') ? 'is-ok' : 'is-warn'}`;
      statusBadge.textContent = statusText;
      statusTd.appendChild(statusBadge);
      tr.appendChild(statusTd);

      els.leaveCyclesTableBody.appendChild(tr);
    });
  }

  // Cursor-Tracked 1px Warm Rim-Light (Strict 2 Focal Elements Visible At Once)
  function attachRimTracking(el) {
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.min(0.92, Math.max(0.08, (e.clientX - rect.left) / rect.width));
      el.style.setProperty('--rim-x', `${(ratio * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rim-x', '50%');
    });
  }

  attachRimTracking(els.topBarFocal);
  attachRimTracking(els.workCardFocal);
  attachRimTracking(els.yearlyOverviewFocal);

  // View Switcher ([월별 관제] <-> [연간 분석])
  els.viewTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchView(btn.getAttribute('data-view-tab'));
    });
  });

  // Chart Metric Switcher & Pointer/Touch Inspection
  els.segButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeChartMetric = btn.getAttribute('data-chart-metric') || 'net';
      els.segButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderChart();
    });
  });

  els.yearlySegButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeYearlyMetric = btn.getAttribute('data-yearly-metric') || 'ot';
      els.yearlySegButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderYearlyChart();
    });
  });

  els.chartViewport.addEventListener('pointermove', (e) => highlightChartPoint(e.clientX));
  els.chartViewport.addEventListener('pointerdown', (e) => highlightChartPoint(e.clientX));
  els.chartViewport.addEventListener('pointerleave', clearChartHighlight);

  els.yearlyChartViewport.addEventListener('pointermove', (e) => highlightYearlyChartPoint(e.clientX));
  els.yearlyChartViewport.addEventListener('pointerdown', (e) => highlightYearlyChartPoint(e.clientX));
  els.yearlyChartViewport.addEventListener('pointerleave', clearYearlyChartHighlight);

  // Auth Modal & Control Bindings
  els.toggleConfigBtn.addEventListener('click', () => {
    openAuthModal({ allowClose: isUnlocked });
  });

  els.closeModalBtn.addEventListener('click', () => {
    if (isUnlocked) closeAuthModal();
  });

  els.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiUrl = els.apiUrlInput.value.trim();
    const secretKey = els.pinInput.value.trim();

    if (!validateHttpsUrl(apiUrl)) {
      showModalError('유효한 HTTPS Apps Script 웹 앱 URL을 입력해 주세요', false);
      els.apiUrlInput.focus();
      return;
    }
    if (!secretKey) {
      showModalError('비밀키(PIN)를 입력해 주세요', true);
      els.pinInput.focus();
      return;
    }

    const nextCfg = { apiUrl, secretKey };
    saveAuthConfig(nextCfg);
    fetchActiveData(nextCfg);
  });

  els.logoutBtn.addEventListener('click', () => {
    clearAuthConfig();
    resetDashboardView();
    openAuthModal({ allowClose: false });
  });

  els.refreshBtn.addEventListener('click', () => {
    fetchActiveData();
  });

  els.copyAiBtn.addEventListener('click', async () => {
    const text = els.aiContextText.textContent || '';
    if (!text || text === '-') return;
    try {
      await navigator.clipboard.writeText(text);
      const orig = els.copyAiBtn.textContent;
      els.copyAiBtn.textContent = '복사 완료';
      setTimeout(() => {
        els.copyAiBtn.textContent = orig;
      }, 1400);
    } catch (_) {
      showError('클립보드 복사에 실패했습니다. 텍스트를 길게 눌러 복사해 주세요');
    }
  });

  // Init
  resetDashboardView();
  fetchActiveData();
})();
