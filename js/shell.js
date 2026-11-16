(function (g) {
'use strict';

var S = g.S;
var T = g.Tint;

var MODULES = [

{ id: 'notes', sect: 'write', name: '读书笔记', desc: '笔记与案评', glyph: '读', color: '#fbf8f1', colorDark: '#4a4742', colorHover: '#efece5', colorDarkHover: '#52504a', ink: 'dark', tn: '鱼肚白' },
{ id: 'docs', sect: 'write', name: '我的文档', desc: '长文与书稿', glyph: '文', color: '#6f5321', colorDark: '#372503', colorHover: '#654916', colorDarkHover: '#3f2d0b', tn: '苍黄 · 压深' },
{ id: 'words', sect: 'read', name: '日进一词', desc: '英语单词本', glyph: '词', color: '#eae3d5', colorDark: '#4d473b', colorHover: '#ded8ca', colorDarkHover: '#554f43', ink: 'dark', tn: '陈纸' },

{ id: 'books', sect: 'read', name: '藏书阁', desc: '读书记录', glyph: '藏', color: '#2b333e', colorDark: '#222934', colorHover: '#222a35', colorDarkHover: '#29313c', tn: '青灰' },
{ id: 'chronicle', sect: 'daily', name: '大事记', desc: '年月记事', glyph: '事', color: '#884028', colorDark: '#3f1e13', colorHover: '#7d361e', colorDarkHover: '#48261b', tn: '蟹蝥红 · 压深' },
{ id: 'diary', sect: 'daily', name: '我的日记本', desc: '一天一页', glyph: '记', color: '#5c4025', colorDark: '#3b2207', colorHover: '#52371c', colorDarkHover: '#442a0f', tn: '驼色 · 压深' },
{ id: 'ledger', sect: 'daily', name: '账本', desc: '收支与统计', glyph: '账', color: '#1a6840', colorDark: '#0d311d', colorHover: '#095e37', colorDarkHover: '#153824', tn: '荷叶绿' },
{ id: 'beach', sect: 'read', name: '冲浪沙滩', desc: '网址收藏', glyph: '滩', color: '#134857', colorDark: '#002f3c', colorHover: '#053f4d', colorDarkHover: '#033644', tn: '苍蓝' },
{ id: 'site', sect: 'write', name: '我的网站', desc: '碎碎念与简介', glyph: '网', color: '#525288', colorDark: '#252543', colorHover: '#49487d', colorDarkHover: '#2c2c4b', tn: '野菊紫' },
];
var MOD = {};
MODULES.forEach(function (m) { MOD[m.id] = m; });

var NAV_SECTS = [
{ id: 'write', name: '写点东西' },

{ id: 'read', name: '读与学' },

{ id: 'daily', name: '日常流水' }

];

var M_CORE = ['notes', 'ledger', 'diary'];

function esc(s) {
return String(s == null ? '' : s)
.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function pad(n) { return String(n).padStart(2, '0'); }
function fmtTime(ts) {
var d = new Date(ts), now = new Date();
var hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
var sameDay = S.ymd(d) === S.ymd(now);
if (sameDay) return '今天 ' + hm;
var y = new Date(now.getTime() - 86400000);
if (S.ymd(d) === S.ymd(y)) return '昨天 ' + hm;
if (d.getFullYear() === now.getFullYear()) return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + hm;
return S.ymd(d) + ' ' + hm;
}
function dayLabel(ds) {
if (!ds) return '';
var today = S.today();
if (ds === today) return '今天';
if (ds === S.daysAgo(1)) return '昨天';
if (ds === S.daysAgo(2)) return '前天';
var p = ds.split('-');
return p[1] + ' 月 ' + p[2] + ' 日';
}

function money(n) {
var v = Math.round(n * 100) / 100;
return '¥' + (v % 1 === 0
? v.toLocaleString('zh-CN')
: v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function season() {
var m = new Date().getMonth() + 1;
if (m >= 3 && m <= 5) return { name: '春', tone: '#5f8c6a' };
if (m >= 6 && m <= 8) return { name: '夏', tone: '#2f7d8c' };
if (m >= 9 && m <= 11) return { name: '秋', tone: '#a3761d' };
return { name: '冬', tone: '#3a5688' };
}

var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';

var JIE_FROM = 1950, JIE_TO = 2100;
var JIE_TAB = '05tf12kx1znb2x7w3vdd4u0r5sy16ru77qem8og49lwwaiwm063612up1zx32xhl3vmx4ua95t7i6s3q7qo68opo9m6faj6206cm1345206j2xr33vwi4ujx5th96sdj7qy28ozk9mgaajfv05ie129y1zce2wx13v2g4tps5smz6rj37q3h8o4y9llpaild05rx12jj1zm12x6n3vc24tzd5swj6rsn7qd28oel9lvfaiv4061o12t61zvj2xg33vli4u8w5t666s2e7qmw8oog9m59aj4z06bi1330205c2xpv3vva4uio5tfy6sc47qwj8oy09meqajee05gy128j1zay2wvj3v0y4tod5slo6rhw7q2c8o3u9lkkaik805qs12id1zkt2x5c3vap4ty05sva6rrh7qbz8odj9lucaiu2060m12s61zul2xf33vkf4u7o5t4w6s147qlo8ona9m42aj3p06a6131n20402xok3vtz4uhd5tep6sb07qvl8ox99me2ajdq05g7127m1z9z2wui3uzx4tna5skj6rgp7q158o2r9ljmaije05pz12hh1zjt2x4a3v9m4twv5su36rqa7qar8oce9ltbait505zq12r81zth2xdv3vj44u6f5t3q6s027qko8omc9m38aj31069m1315203g2xnu3vt34ugc5tdk6s9s7quc8ovy9mcrajch05f2126m1z912wtj3uyu4tm25sja6rfh7q008o1n9lijaii905ou12ge1zir2x393v8j4tvq5ssv6rp17q9k8ob99ls7ais205yo12q71zsi2xcx3vi64u5c5t2h6ryn7qj68okt9m1paj1h068212zj201u2xm93vrk4uev5tc66s8f7qt08oum9mbhajb805dt125b1z7n2ws33uxe4tko5shw6re27pyj8o059lgzaigr05ne12ey1zha2x1q3v6y4tu45srb6rni7q828o9q9lqmaiqd05wx12od1zqn2xb03vg84u3h5t0r6rx47qhu8ojn9m0laj0c066u12y8200g2xkt3vq14uda5taj6s6t7qrf8ot69ma3aj9v05cd123s1z612wqe3uvm4tiv5sg46rcd7pwz8nyr9lfsaifm05m812do1zfv2x053v5a4tsg5spn6rlx7q6l8o8f9lpiaiph05w512nn1zpu2xa23vf34u265szc6rvl7qg98oi29lz3aiyy065l12x31zzc2xjm3vor4ubv5t936s5e7qq48ory9m8zaj8t05bf122x1z582wpm3uus4thw5sf06rb67pvs8nxk9lemaiej05l712cr1zf22wzf3v4l4trn5sop6rku7q5e8o779loaaio805uv12mc1zok2x8u3vdz4u155syd6run7qfc8oh69ly9aiy6064t12w91zyg2xir3vnx4ub45t8c6s4l7qp68oqv9m7uaj7p05ad121v1z452woh3utn4tgt5se06ra97puv8nwm9ldkaidf05k212bl1zdv2wy53v384tqc5snj6rju7q4k8o6e9lngainc05tz12lg1znn2x7w3vcz4u025sx76rti7qe88og39lx4aiwy063h12uv1zx12xha3vmf4u9l5t6t6s367qny8opv9m6xaj6s059b120o1z2s2wn23us74tfc5scj6r8s7pth8nvd9lchaicg05j412ak1zco2wwu3v1v4tox5sm16ria7q2z8o4v9lm1aim105sp12k41zm62x683vb64ty75svf6rrt7qco8oeo9lvuaivs062f12tv1zvz2xg33vl24u835t596s1k7qmc8oo99m5daj5a057y11zf1z1m2wlu3uqu4tdt5saw6r747pru8ntr9laxaiax05hl12921zb72wvd3v0c4tna5skd6rgm7q1e8o3e9lknaikq05rg12iw1zl02x553va34tx25su56rqd7qb38od19lu8aiu8060w12sc1zug2xel3vjl4u6m5t3s6s047qku8omr9m3xaj3w056k11y11z062wkd3upe4tcf5s9k6r5u7pqk8nsg9l9lai9m05gc127v1za22wu83uz64tm55sj86rfg7q078o259ljcaijb05py12hd1zjg2x3k3v8i4tvj5ssp6rp47qa18oc39ltbaita05zv12r81zta2xde3vie4u5h5t2o6rz17qju8olv9m32aj32055o11x21yz42wj83uo84tb95s8e6r4o7pph8nrh9l8rai8t05fi126x1z8x2wsx3uxr4tkq5shv6re87pz48o189likaiip05ph12gx1ziy2x2x3v7p4tul5srp6ro27q8y8ob09lsaaisb05z112qg1zsj2xck3vhe4u4b5t1e6rxr7qin8okq9m20aj21054p11w51yy82wic3un94ta65s776r3g7poa8nqd9l7pai7t05ej12601z832ws63ux14tjx5sgw6rd37pxv8nzx9lhaaihe05o412fh1zhh2x1h3v6b4tt85sqc6rmo7q7k8o9p9lr1air505xu12p81zr82xb73vg34u325t076rwk7qhd8ojd9m0maj0p053f11uv1ywx2wgy3ult4t8q5s5t6r247pmx8nox9l66ai6905cz124f1z6h2wqf3uv74ti15sf46rbh7pwf8nyl9lfzaig305ms12e61zg62x053v4w4trr5sou6rl77q668o8b9lpoaipq05wd12no1zpn2x9m3veg4u1c5syf6rus7qfq8ohx9lzaaize052211te1yvb2wfa3uk34t6z5s426r0d7pla8nng9l4wai5405bx123c1z5a2wp63utw4tgq5sdr6ra17pux8nx29leiaieq05li12cx1zeu2wyo3v3b4tq45sn66rjm7q4m8o6v9lobaioh05v812mm1zol2x8i3vd84u025sx56rtj7qeh8ogo9ly2aiy7050y11sd1yuf2wee3uj64t5z5s2z6qz97pk48nma9l3qai3w05ao12231z422wnz3uso4tff5scf6r8r7ptq8nw09ldjaids05kk12by1zdw2wxr3v2h4tpa5smc6riq7q3o8o5v9lnbainh05u812lm1znj2x7g3vc64tz15sw46rsh7qdf8ofl9lx0aix504zw11ra1yt92wd53uhv4t4p5s1r6qy47pj38nla9l2qai2x059p12141z342wn13urp4teh5sbi6r7v7psu8nv39lckaicq05jf12aq1zcm2wwf3v134tnv5skx6rhd7q2h8o4u9lmcaimi05t612kf1zm92x623var4txn5sur6rr67qc88oej9lw2aiw904yz11qb1ys62wbz3ugn4t3g5s0i6qwu7pht8nk39l1nai1x058q12031z1w2wlk3uq24tcq5s9q6r657pr88ntm9lb9aibm05ih129u1zbo2wvd3uzv4tmi5sjj6rfz7q138o3g9lkzail905s112jf1zlb2x523v9m4twa5st86rpl7qan8od09lukaiut04xl11oy1yqv2wao3uf94t1x5ryt6qv47pg48nih9l04ai0g057b11yq1z0n2wkg3up14tbo5s8l6r4v7ppt8ns59l9saia405gy128a1za32wtt3uyd4tl25si16ref7pzg8o1t9ljeaijp05qi12hv1zjp2x3f3v804tus5sru6ro97q9a8obk9lt3aitc04w611nk1yph2w9a3udw4t0m5rxm6qu07pf08nha9kytahz2055u11x81yz32wit3una4t9w5s6v6r3b7poh8nqx9l8kai8v05fn126y1z8r2wsg3uwz4tjo5sgp6rd77pye8o0v9lihaiir05pg12gp1zig2x253v6q4ttg5sqh6rmx7q828oai9ls6aish04v811mh1yo82w7w3uce4sz15rw16qsg7pdk8ng29kxtahy9055411wh1yy82whu3um94t8v5s5u6r297pne8npv9l7lai8005ev12671z7x2wri3uvv4tif5sfd6rbu7px28nzl9lhcaihp05oj12fv1zhn2x1a3v5p4tsb5sp96rlp7q6v8o9d9lr2airg04ua11ln1yni2w783ubp4syb5rv76qrj7pcl8nf19kwsahx7054211vf1yx72wgt3ul74t7p5s4k6r0x7pm28nol9l6eai6w05ds12541z6v2wqf3uuu4thf5see6rau7pw08nyh9lg6aigl05nf12er1zgj2x053v4l4tr85so76rkm7q5q8o859lptaiq604t011kd1ym52w5s3ua64swq5rtm6qq07pb58ndn9kvdahvr052n11u01yvt2wfg3ujv4t6e5s3b6qzr7pkx8nng9l57ai5l05cd123m1z5b2wow3uta4tfu5scs6r987pui8nx39levaif905m012d81zev2wyf3v2t4tpg5smg6riw7q448o6p9lohaiox04rq11j01ykp2w493u8n4sv95rs86qon7p9t8ncc9ku5ahun051j11su1yuh2wdw3ui44t4k5s1g6qxx7pj78nlu9l3qai4905b6122h1z452wnk3urs4te95sb66r7q7pt28nvp9ldjaidy05kt12c41zdu2wxd3v1o4to65sl26rhi7q2s8o5e9ln8aino04qi11ht1yji2w323u7c4str5rqk6qmy7p858nas9ksqahta050711rj1yt82wcr3uh24t3i5s0d6qws7pi08nko9l2lai3505a1121b1z2x2wmd3uqn4td45sa16r6h7prr8nue9lcaaics05jo12ay1zcl2ww13v0a4tmt5sjs6rg97q1i8o439llxaimf04pb11go1yif2w1y3u694ssr5rpp6qm67p7e8na09kruahsb04z811qj1ys72wbm3uft4t275rz16qvj7pgv8njm9l1kai23058y12071z1t2wl83upf4tbv5s8t6r5d7pqr8nti9lbgaiby05ir129y1zbj2wuz3uz94tls5siq6rf87q0j8o399ll7ailq04ol11fu1yhe2w0s3u4y4src5ro66qkl7p5w8n8m9kqmahra04ya11pm1yr72waj3uen4t105rxv6qud7pfp8nih9l0gai12058011zb1z0w2wk83uob4tao5s7i6r407ppe8ns69la5aiap05hl128v1zah2wtv3uy04tkd5sh76rdn7pyy8o1p9ljoaik904n611eh1yg52vzm3u3u4sq85rn26qjg7p4q8n7g9kpfahq204x011oa1ypv2w973udb4szm5rwe6qss7pe48ngw9kyyahzm056k11xu1yze2wio3ums4t955s616r2k7pnx8nqo9l8nai9805g5127e1z8z2wsc3uwi4tiy5sfv6rce7pxq8o0f9lidaiix04lt11d31yeo2vy13u254sog5rl86qhp7p318n5t9knuahog04ve11mp1yo92w7l3ubo4sxz5rut6qrc7pct8nfo9kxrahyc055611wd1yxu2wh43ul84t7l5s4h6r117pmi8npe9l7iai8405ez12641z7k2wqt3uuw4th95se46ran7pw18nyw9lh1aihp04ko11bw1yde2vwn3u0q4sn35rjy6qgh7p1w8n4q9kmvahnm04un11lx1yne2w6j3uag4swn5rtg6qpy7pbf8ned9kwjahxa054b11vm1yx42wga3uk74t6d5s366qzr7pl98no79l6cai7005dy12581z6s2wq33uu54tgf5sd96r9r7pv68ny39lg7aigw04ju11b41yco2vvz3tzz4sm65riu6qf87p0l8n3h9klnahmg04th11ks1ymc2w5k3u9l4svt5rsk6qp17pag8ndd9kvjahwa053911ui1yvz2wf63uj74t5i5s2d6qyw7pkb8nn79l5bai6005cy12471z5o2wow3usw4tf65sc06r8i7ptw8nwq9letaifh04ig119q1yba2vuk3tyl4skw5rhq6qea7ozr8n2m9kkpahle04sc11jl1yl12w473u854suc5rr46qno7p978nc79kufahv4052111t61yuk2wdp3uhm4t3t5s0n6qx97piu8nlv9l42ai4r05bn122r1z442wna3ura4tdl5sah6r737psm8nvm9lduaiel04hj118p1ya22vt53twz4sj55rfv6qcc7oxu8n0u9kj4ahjz04r211ib1yjp2w2q3u6i4ssm5rpd6qlx7p7i8nal9ksvahtp050p11ry1ytb2wce3ug74t2b5rz36qvo7pha8nkd9l2nai3f05ae121m1z302wm43upy4tc25s8r6r587pqq8ntq9lc1aicu04fv11751y8m2vrs3tvo4shu5rek6qb17owj8mzk9khvahiq04pt11h21yif2w1h3u5a4sre5ro36qkl7p648n969krjahsf04zi11qq1ys32wb43uew4t105rxr6quc7pfw8nix9l16ai20059012091z1o2wks3uoo4tav5s7p6r4b7ppv8nsw9lb4aibw04ew11661y7m2vqq3tuj4sgm5rdb6q9s7ovb8myd9kgoahhi04ok11ft1yh92w0b3u444sq65rmw6qjg7p538n899kqmahrf04yd11pi1yqt2w9v3udq4szx5rwq6qtd7pf18ni79l0kai1e058c11zg1z0q2wjq3unk4t9p5s6g6r2z7pok8nrn9la0aiaw04dy11561y6i2vph3tta4sfe5rc66q8r7oud8mxh9kfvahgs04nw11f41ygf2vzb3u2z4soz5rlp6qib7p3z8n779kpmahqj04xm11ou1yq52w923ucp4syo5rvc6qry7pdn8ngu9kz8ai03057311ya1yzm2win3umf4t8i5s586r1t7png8nqn9l91ai9x04cy11451y5h2voh3ts84se75rat6q787oss8mvy9kefahff04mk11ds1yf32vy13u1o4snn5rka6qgs7p2e8n5l9ko2ahp004w211n91yoi2w7f3ub44sx75rtz6qqm7pc98nff9kxuahyq055s11wz1yya2wh73ukw4t6x5s3m6r057plr8nou9l77ai83';

var JIE_DAY = [6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];

function jieTime(y, k) {
if (y < JIE_FROM || y > JIE_TO) {

return Date.UTC(y, k, JIE_DAY[k], 8, 0) - 8 * 3600000;
}
var i = (y - JIE_FROM) * 48 + k * 4;
var min = parseInt(JIE_TAB.substr(i, 4), 36);
return Date.UTC(y, 0, 1) - 8 * 3600000 + min * 60000;
}

function gzYearIdx(d) {
var y = d.getFullYear();
if (d.getTime() < jieTime(y, 1)) y -= 1;

return ((y - 4) % 60 + 60) % 60;
}
function gzYear(d) {
var n = gzYearIdx(d);
return GAN.charAt(n % 10) + ZHI.charAt(n % 12);
}
function gzMonth(d) {
var t = d.getTime(), y = d.getFullYear();

var k = -1;
for (var i = 11; i >= 0; i--) {
if (t >= jieTime(y, i)) { k = i; break; }
}
var z;
if (k < 0) z = 0;

else z = (k + 1) % 12;

var seq = (z - 2 + 12) % 12;

var gan = ((gzYearIdx(d) % 10) * 2 + 2 + seq) % 10;
return GAN.charAt(gan) + ZHI.charAt(z);
}
function gzDay(d) {
var Y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
var a = Math.floor((14 - m) / 12), y = Y + 4800 - a, mm = m + 12 * a - 3;
var jdn = dd + Math.floor((153 * mm + 2) / 5) + 365 * y +
Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
var n = ((jdn + 49) % 60 + 60) % 60;
return GAN.charAt(n % 10) + ZHI.charAt(n % 12);
}

var HS_EPOCH = 300000;
function sapiensYear(d) { return HS_EPOCH + d.getFullYear(); }
function stars(n) {
var out = '';
for (var i = 0; i < 5; i++) out += i < n ? '★' : '☆';
return out;
}

var CLOTH = ['#8c4a3c', '#7a5a2e', '#456b52', '#3d6580', '#6b4a72', '#4a5a68'];
function spine(title) {
var t = String(title || '').replace(/[《》\s]/g, '');
var h = 0;
for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 9973;
var bg = CLOTH[h % CLOTH.length];
var chars = t.slice(0, 2) || '书';
return {
bg: bg, ink: '#f6f1e6', chars: chars,
style: 'background:' + bg + ';color:#f6f1e6'
};
}

var toastTimer = null;
function toast(msg, kind) {
var t = $('#toast'), m = $('#toastMsg');
m.textContent = msg;

if (kind === 'err') t.classList.add('err');
else t.classList.remove('err');
t.classList.add('on');
clearTimeout(toastTimer);
toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2400);
}

var deferredInstall = null;
try {
g.addEventListener('beforeinstallprompt', function (e) {
try { e.preventDefault(); } catch (e2) { }
deferredInstall = e;

try { if (g.App && g.App.activeId === 'sync' && g.App.refresh) g.App.refresh(); } catch (e3) { }
});
g.addEventListener('appinstalled', function () {
deferredInstall = null;
try { toast('已装到桌面', 'ok'); } catch (e4) { }
try { if (g.App && g.App.activeId === 'sync' && g.App.refresh) g.App.refresh(); } catch (e5) { }
});
} catch (e) { }

var undoTimer = null, undoFn = null;
function offerUndo(text, fn, onExpire) {
var bar = $('#undo'), txt = $('#undoText'), btn = $('#undoBtn');
if (!bar) return;
txt.textContent = text;
undoFn = fn;
bar.classList.add('on');
clearTimeout(undoTimer);
undoTimer = setTimeout(function () {
bar.classList.remove('on');
undoFn = null;

if (onExpire) { try { onExpire(); } catch (e) {} }
}, 6000);
btn.onclick = function () {
var f = undoFn;
bar.classList.remove('on');
clearTimeout(undoTimer);
undoFn = null;
if (f) f();
};
}

var histReady = false;

var histBacking = false;

var histReplay = false;

function histState() {
try { return history.state; } catch (e) { return null; }
}
function histUrl(id) {
return location.pathname + location.search + '#' + id;
}

function histHashId() {
var h = (location.hash || '').replace(/^#/, '');
return h && (MOD[h] || h === 'sync' || h === 'overview') ? h : '';
}
function histPush(id) {
if (!histReady || histReplay) return false;
var st = histState();
if (st && st.v === id && !st.modal) return false;
try { history.pushState({ v: id }, '', histUrl(id)); return true; } catch (e) { return false; }
}
function histPushModal() {
if (!histReady || histReplay) return false;
try { history.pushState({ modal: 1 }, '', location.href); return true; } catch (e) { return false; }
}
function histInit() {
histReady = true;
var st = histState();

if (st && st.v === activeId) return;
try { history.replaceState({ v: activeId }, '', histUrl(activeId)); } catch (e) { }
}

var modalStack = [];

var inertSet = [];

function markInert(el, on) {
if (!el) return;
try { el.inert = !!on; } catch (e) { }
try {
if (on) { if (!el.hasAttribute('inert')) el.setAttribute('inert', ''); }
else el.removeAttribute('inert');
} catch (e) { }
}

function setBackdropInert(on) {
try {
var body = document.body;
if (!body) return;
if (on) {
if (inertSet.length) return;

for (var i = 0; i < body.children.length; i++) {
var el = body.children[i];
if (!el || el.id === 'modalRoot') continue;
if (el.inert || el.hasAttribute('inert')) continue;
markInert(el, true);
inertSet.push(el);
}
} else {
for (var j = 0; j < inertSet.length; j++) markInert(inertSet[j], false);
inertSet.length = 0;
}
} catch (e) { inertSet.length = 0; }
}

var FOCUS_SEL = 'a[href],button,input:not([type=hidden]),select,textarea,[tabindex]';
function focusables(root) {
var out = [];
if (!root || !root.querySelectorAll) return out;
var list;
try { list = root.querySelectorAll(FOCUS_SEL); } catch (e) { return out; }
for (var i = 0; i < list.length; i++) {
var el = list[i];
if (el.disabled) continue;
if (el.getAttribute('aria-hidden') === 'true') continue;
if (el.hasAttribute('inert') || el.inert) continue;
var ti = el.getAttribute('tabindex');
if (ti !== null && Number(ti) < 0) continue;
out.push(el);
}
return out;
}

function removeMask(mask) {
if (!mask) return;
mask.classList.add('closing');
setTimeout(function () {
if (mask.parentNode) mask.parentNode.removeChild(mask);

var i = modalStack.indexOf(mask);
if (i >= 0) modalStack.splice(i, 1);

if (modalStack.length === 0) setBackdropInert(false);

var back = mask._prevFocus;
mask._prevFocus = null;
var top = modalStack[modalStack.length - 1];
if (back && (!top || (top.contains && top.contains(back)))) {
try { if (back.isConnected && typeof back.focus === 'function') back.focus(); } catch (e) { }
}
}, 130);
}
function modal(opts) {
opts = opts || {};
var mask = document.createElement('div');
mask.className = 'mask';
mask.innerHTML =
'<div class="modal' + (opts.wide ? ' wide' : '') + '">' +
'  <div class="modal-head"><div class="modal-title">' + esc(opts.title || '') + '</div>' +
'  <button class="modal-x" data-close>✕</button></div>' +
'  <div class="modal-body">' + (opts.body || '') + '</div>' +
'  <div class="modal-foot">' + (opts.foot || '') + '</div>' +
'</div>';

var prevFocus = document.activeElement;
mask._prevFocus = (prevFocus && prevFocus !== document.body) ? prevFocus : null;
$('#modalRoot').appendChild(mask);
modalStack.push(mask);

mask._hist = histPushModal();

if (modalStack.length === 1) setBackdropInert(true);
if (opts.onMount) opts.onMount(mask);
function close() {
if (mask.classList.contains('closing')) return;

if (mask._hist && histState() && histState().modal) {
mask.classList.add('closing');
histBacking = true;
try { history.back(); } catch (e) { histBacking = false; removeMask(mask); return; }

setTimeout(function () {
if (mask.parentNode && modalStack.indexOf(mask) >= 0) {
histBacking = false;
removeMask(mask);
}
}, 400);
return;
}
removeMask(mask);
}
mask.addEventListener('click', function (e) {
if (e.target === mask || e.target.hasAttribute('data-close')) close();
});
mask.close = close;

var target = opts.focus ? mask.querySelector(opts.focus) : null;
if (!target) target = mask.querySelector('input:not([type=hidden]), textarea');
if (!target) target = mask.querySelector('select');
if (!target) target = mask.querySelector('.modal button');
if (target) {
setTimeout(function () {

if (!mask.parentNode) return;
try {
target.focus();

var tag = String(target.tagName || '').toLowerCase();
if (tag === 'input' && target.select) {
var ty = String(target.type || 'text').toLowerCase();
if (ty !== 'checkbox' && ty !== 'radio' && ty !== 'file' && ty !== 'button' && ty !== 'submit') target.select();
}
} catch (e) { }
}, 40);
}
return mask;
}
function closeTopModal() {
if (modalStack.length) modalStack[modalStack.length - 1].close();
}

function onPop(e) {
if (histBacking) {
histBacking = false;
removeMask(modalStack[modalStack.length - 1]);
return;
}
if (modalStack.length) {
removeMask(modalStack[modalStack.length - 1]);
return;
}
var st = e && e.state;
var id = (st && st.v) || histHashId() || 'overview';
if (!(MOD[id] || id === 'sync' || id === 'overview')) id = 'overview';
histReplay = true;
try { openModule(id, true); } catch (err) {
}
setTimeout(function () { histReplay = false; }, 0);
}

function applyTheme() {
var meta = S.db.meta;
var mode = meta.theme === 'auto'
? (g.matchMedia && g.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
: meta.theme;
var p = T.palette(meta.tint, mode, meta.custom);
var root = document.documentElement;
Object.keys(p).forEach(function (k) { root.style.setProperty('--' + k, p[k]); });
root.setAttribute('data-theme', mode);
root.setAttribute('data-tint', meta.tint);

var tc = document.querySelector('meta[name="theme-color"]');
if (tc && p.bg && tc.getAttribute('content') !== p.bg && tc.parentNode) {
var fresh = document.createElement('meta');
fresh.setAttribute('name', 'theme-color');
fresh.setAttribute('content', p.bg);
tc.parentNode.replaceChild(fresh, tc);
}
}
function setTheme(patch) {
var meta = S.db.meta;
if (patch.theme) meta.theme = patch.theme;
if (patch.custom) meta.custom = patch.custom;
if (patch.tint) {
if (patch.tint === T.CUSTOM && !meta.custom) {

var cur = T.tint(meta.tint);
meta.custom = { base: cur.base, accent: cur.accent };
}
meta.tint = patch.tint;
}
applyTheme();
S.save();

renderSwatches();
markMode();
}

function renderSwatches() {
var box = $('#swatches');
if (!box) return;
var meta = S.db.meta;
var mode = document.documentElement.getAttribute('data-theme');
var list = T.TINTS.slice();
var html = list.map(function (t) {
var sw = T.swatch(t.id, mode);
return '<div class="sw' + (meta.tint === t.id ? ' on' : '') + '" data-act="pick-tint" data-id="' + t.id + '" ' +
'title="' + esc(t.label) + '" style="background:' + sw.bg + ';--sw-accent:' + sw.accent +
';--sw-ink:' + sw.ink + ';--sw-sealink:' + sw.panel + '">' +
'<span class="sw-t">' + esc(t.label.slice(0, 1)) + '</span>' +
'<span class="sw-lb">' + esc(t.label) + '</span></div>';
}).join('');
if (meta.custom) {
var cs = T.swatch(T.CUSTOM, mode, meta.custom);
html += '<div class="sw' + (meta.tint === T.CUSTOM ? ' on' : '') + '" data-act="pick-tint" data-id="custom" ' +
'title="自定纸色" style="background:' + cs.bg + ';--sw-accent:' + cs.accent +
';--sw-ink:' + cs.ink + ';--sw-sealink:' + cs.panel + '">' +
'<span class="sw-t">定</span><span class="sw-lb">自定</span></div>';
}
box.innerHTML = html;
var base = $('#tmBase'), acc = $('#tmAccent');
if (base) base.value = (meta.custom && meta.custom.base) || T.tint(meta.tint).base;
if (acc) acc.value = (meta.custom && meta.custom.accent) || T.tint(meta.tint).accent;
}
function markMode() {
var meta = S.db.meta;
$$('#themeMenu .modes button').forEach(function (b) {
b.classList.toggle('on', b.dataset.mode === meta.theme);
});
}

var dataPath = '';

function learnDataPath() {
if (dataPath || !g.fetch) return;

dataPath = '这台设备'; return;
fetch('/api/health', { cache: 'no-store' }).then(function (r) { return r.json(); })
.then(function (d) {
if (d && d.ok && d.data) { dataPath = d.data; renderRail(); }
else dataPath = '';
}).catch(function () { dataPath = ''; });
}

function navOrderIds() {
var saved = S.db.meta.navOrder;
var out = [], seen = {};
function take(id) {
if (!MOD[id] || seen[id]) return;
seen[id] = 1; out.push(id);
}
if (Array.isArray(saved)) saved.forEach(take);

MODULES.forEach(function (m) { take(m.id); });
return out;
}
function navItemHtml(id) {
var m = MOD[id];
if (!m) return '';

return '<div class="nav-item" data-view="' + id + '"' +
(M_CORE.indexOf(id) >= 0 ? ' data-m-core="1"' : '') +
' tabindex="0" role="button">' +

'<span class="nav-mark"' + (m.ink === 'dark' ? ' data-ink="dark"' : '') +
' style="--tint:' + m.color + ';--tint-dark:' + m.colorDark + '">' + m.glyph + '</span>' +
'<span class="nm">' + esc(m.name) + '</span>' +
'</div>';
}

function renderRail() {
var db = S.db;
var name = db.meta.name || '我的工作台';
$('#brandName').textContent = name;
$('#brandSeal').textContent = (name.replace(/的工作台$/, '') || '台').slice(0, 1);
var order = navOrderIds();

var html = '';
NAV_SECTS.forEach(function (sec) {
var ids = order.filter(function (id) { return MOD[id].sect === sec.id; });
if (!ids.length) return;
html += '<div class="nav-group" data-sect="' + sec.id + '">' +
'<div class="nav-section">' + esc(sec.name) + '</div>' +
ids.map(navItemHtml).join('') +
'</div>';
});

var loose = order.filter(function (id) { return !MOD[id].sect; });
if (loose.length) {
html += '<div class="nav-group" data-sect="other">' +
'<div class="nav-section">其他</div>' +
loose.map(navItemHtml).join('') + '</div>';
}
$('#moduleList').innerHTML = html;
var col = $('#colophon');
var a = db.meta.archive;

var where;
if (!S.storageOk()) where = '<b class="warn">浏览器不让存，关掉就丢</b>';
else where = '数据只在这个浏览器里，不上传';

col.innerHTML = (name === '我的工作台' ? '' : esc(name) + ' · ') + 'v' + S.VERSION +
(g.__GZT_BUILD
? ' · <span class="cp-build" title="构建号，每次发布都会变">#' + esc(g.__GZT_BUILD) + '</span>'
: '') +
'<br>' + where;
document.title = name;
learnDataPath();
}
function markRail(view) {
var inMore = false;
$$('aside .nav-item').forEach(function (el) {
var on = el.dataset.view === view;
el.classList.toggle('active', on);

if (on && el.hasAttribute('data-view') && !el.hasAttribute('data-m-core')) inMore = true;

if (on && el.scrollIntoView) {
try { el.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { }
}
});

var mb = $('#mMoreBtn');
if (mb) {
mb.classList.toggle('active', inMore);
var nmEl = mb.querySelector('.nm');
var mkEl = mb.querySelector('.nav-mark');
var m = MOD[view];
if (nmEl) nmEl.textContent = inMore && m ? m.name : '更多';

if (mkEl) {
mkEl.textContent = inMore && m ? m.glyph : '⋯';

if (inMore && m && m.ink === 'dark') mkEl.setAttribute('data-ink', 'dark');
else mkEl.removeAttribute('data-ink');
}
}
}

function moreOpen() { return document.body.classList.contains('m-more-open'); }
function openMore() { document.body.classList.add('m-more-open'); }
function closeMore() { if (moreOpen()) document.body.classList.remove('m-more-open'); }

var tabs = new Map();
var activeId = 'overview';

function syncTabbar() {
$('#tabbar').classList.toggle('hidden', tabs.size === 0);
}
function newTab(id, title, color, glyph) {
var m = MOD[id];
var el = document.createElement('div');
el.className = 'tab';

var seal = m
? '<span class="tab-seal"' + (m.ink === 'dark' ? ' data-ink="dark"' : '') +
' style="--tint:' + m.color + ';--tint-dark:' + m.colorDark + '">' + m.glyph + '</span>'
: (glyph
? '<span class="tab-seal" style="--tint:' + (color || '#8a7f6d') + '">' + esc(glyph) + '</span>'
: '<span class="dot" style="background:' + (color || 'var(--ink-faint)') + '"></span>');
el.innerHTML = seal +
'<span class="label">' + esc(title) + '</span><span class="close" data-close-tab="' + id + '">✕</span>';
el.addEventListener('click', function (e) {
if (e.target.dataset.closeTab) { e.stopPropagation(); closeTab(e.target.dataset.closeTab); return; }
showTab(id);
});
el.addEventListener('auxclick', function (e) {
if (e.button === 1) { e.preventDefault(); closeTab(id); }
});
$('#tabbar').appendChild(el);
syncTabbar();
return el;
}
function closeTab(id) {
var t = tabs.get(id);
if (!t) return;
t.el.remove();
if (t.pane) t.pane.remove();
tabs.delete(id);
syncTabbar();
if (activeId === id) showTab(tabs.size ? Array.from(tabs.keys()).pop() : 'overview');
}

function isStandalone() {
try { return !!(g.matchMedia && g.matchMedia('(display-mode: standalone)').matches); } catch (e) { return false; }
}

function mbarWantsInk() {
var v = null;
try { v = localStorage.getItem('gzt.mbarNeutral'); } catch (e) { }
if (v === '1') return true;
if (v === '0') return false;
return isStandalone();
}
function applyMbarStyle() {
document.body.classList[mbarWantsInk() ? 'add' : 'remove']('mbar-ink');
}

function syncMbar(id) {

document.body.classList[id === 'overview' ? 'remove' : 'add']('mbar-off');
var t = $('#mbarTitle');
if (t) {
var m = MOD[id];
t.textContent = m ? m.name : (id === 'sync' ? '数据同步' : (S.db.meta.name || '我的工作台'));
}

var sub = $('#mbarDate');
if (sub) {
var d = new Date();
var wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

sub.textContent = gzYear(d) + '年 · ' + (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + wk;
}
}

function showTab(id, noHist) {
activeId = id;
closeMore();

$$('.tab').forEach(function (t) { t.classList.remove('active'); });
$$('.pane').forEach(function (p) { p.classList.remove('active'); });
if (id === 'overview') {
$('#pane-overview').classList.add('active');
renderOverview();
} else if (id === 'sync') {
var sp = ensurePane('sync');
sp.classList.add('active');
renderSync();
} else {
var t = tabs.get(id);
if (t) {
t.el.classList.add('active');
t.pane.classList.add('active');

renderModule(id, t.pane);
}
}
markRail(id === 'overview' || id === 'sync' ? id : id);
syncMbar(id);
if (!noHist) histPush(id);
}
function ensurePane(id) {
var existing = document.getElementById('pane-' + id);
if (existing) return existing;
var pane = document.createElement('div');
pane.className = 'pane';
pane.id = 'pane-' + id;
$('#panes').appendChild(pane);
return pane;
}
function openModule(id, noHist) {

if (id !== activeId && g.App && g.App.notesExitReading && g.App.notesExitReading()) {
try { if (g.App.refresh) g.App.refresh(); } catch (e) { }
}
if (id === 'overview') { showTab('overview', noHist); return; }
if (id === 'sync') { showTab('sync', noHist); return; }
var m = MOD[id];
if (!m) return;
if (tabs.has(id)) { showTab(id, noHist); return; }
var pane = ensurePane(id);
tabs.set(id, { el: newTab(id, m.name), pane: pane });
renderModule(id, pane);
showTab(id, noHist);
}

function openRaw(id, title, color, glyph) {
if (tabs.has(id)) { showTab(id); return; }
var pane = ensurePane(id);
tabs.set(id, { el: newTab(id, title, color, glyph), pane: pane });
renderModule(id, pane);
showTab(id);
}

var Views = {};
function view(id, def) { Views[id] = def; }

var lazyState = {};

function lazyUrlFor(id) {
var L = g.__GZT_LAZY;
if (!L || !L.maps) return null;
for (var url in L.maps) {
if (Object.prototype.hasOwnProperty.call(L.maps, url) &&
L.maps[url].indexOf(id) >= 0) return url;
}
return null;
}
function loadLazy(url, id, pane) {
if (lazyState[url] === 'ok') { renderModule(id, pane); return; }
if (lazyState[url] === 'loading') return;
lazyState[url] = 'loading';
pane.innerHTML = '<div class="empty"><div class="mark">·</div><div class="t">正在把这一块取过来</div>' +
'<div class="d">第一次进来要多等一会儿，之后就从缓存里取</div></div>';
var s = document.createElement('script');
s.src = url + (g.__GZT_BUILD ? '?v=' + g.__GZT_BUILD : '');
s.onload = function () { lazyState[url] = 'ok'; renderModule(id, pane); };
s.onerror = function () {
lazyState[url] = 'fail';
pane.innerHTML = '<div class="empty"><div class="mark">!</div><div class="t">这一块没取过来</div>' +
'<div class="d">' + esc(url) + ' 加载失败，检查一下网络</div>' +
'<button class="btn primary" data-act="reload-lazy" data-url="' + esc(url) + '">再试一次</button></div>';
};
document.head.appendChild(s);
}
function renderModule(id, pane) {
var v = Views[id];

docProgress(null);
if (!v && lazyUrlFor(id)) { loadLazy(lazyUrlFor(id), id, pane); return; }
if (!v) { pane.innerHTML = '<div class="empty"><div class="mark">空</div><div class="t">这个模块还没做</div></div>'; return; }
var scroll = pane.scrollTop;
pane.innerHTML = v.render();
pane.scrollTop = scroll;
if (v.mount) v.mount(pane);
watchScroll(pane);
}

function ensureChrome() {
if (g.__gztChrome) return g.__gztChrome;
var bar = document.createElement('div');
bar.id = 'readBar';
var top = document.createElement('button');
top.id = 'toTop';
top.type = 'button';
top.title = '回到顶部';
top.setAttribute('aria-label', '回到顶部');
top.textContent = '↑';
top.onclick = function () {
var p = document.querySelector('.pane.active');
if (p) {
try { p.scrollTo({ top: 0, behavior: 'smooth' }); }
catch (e) { p.scrollTop = 0; }
}
var ta = document.querySelector('#docBody');
if (ta) { try { ta.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { ta.scrollTop = 0; } }
};
document.body.appendChild(bar);
document.body.appendChild(top);
g.__gztChrome = { bar: bar, top: top };
return g.__gztChrome;
}

function watchScroll(pane) {
if (!pane || pane.__gztScroll) { syncToTop(pane); return; }
pane.__gztScroll = true;
pane.addEventListener('scroll', function () { syncToTop(pane); }, { passive: true });
syncToTop(pane);
}

function syncToTop(pane) {
var c = ensureChrome();
var y = pane ? pane.scrollTop : 0;

var over = y > (pane ? pane.clientHeight : 400) * 0.9;
c.top.classList.toggle('on', over);
}

function docProgress(ta) {
var c = ensureChrome();
if (!ta) { c.bar.classList.remove('on'); c.bar.style.width = '0%'; return; }
var max = ta.scrollHeight - ta.clientHeight;
if (max < 40) { c.bar.classList.remove('on'); c.bar.style.width = '0%'; return; }
c.bar.classList.add('on');
c.bar.style.width = Math.min(100, Math.max(0, ta.scrollTop / max * 100)) + '%';
}

var sorting = false;

function clip(s, n) {
s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
if (!s) return '';
return s.length > n ? s.slice(0, n) + '…' : s;
}

function greetingHtml() {
var h = new Date().getHours();
var hi = h < 5 ? '夜深了' : h < 9 ? '早上好' : h < 11 ? '上午好'
: h < 13 ? '中午好' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了';
var t = S.today();
var page = S.db.diary[t];
var chars = page && page.text ? String(page.text).replace(/\s/g, '').length : 0;
var nNotes = S.liveNotes().filter(function (n) { return S.ymd(n.createdAt) === t; }).length;
var nTl = S.db.timeline.filter(function (x) { return x.date === t; }).length;

var tail;
if (chars) tail = '今天写了 <b>' + chars + '</b> 字';
else if (nNotes) tail = '今天抄了 <b>' + nNotes + '</b> 条，日记还空着';
else if (nTl) tail = '今天记下 <b>' + nTl + '</b> 件事，日记还空着';
else tail = '今天还没写，随手一句也好';
return '<div class="hello"><span class="hi-hi">' + hi + '</span>' +
'<span class="hi-sep">，</span><span class="hi-t">' + tail + '</span></div>';
}

function wishCardHtml() {
var w = S.db.meta.wish || '';
return '<div class="card wish-card" data-wish="1" title="点一下，写下你想加的下一样">' +
'<div class="wish-plus">＋</div>' +
'<div class="wish-t">待开发</div>' +
'<div class="wish-d' + (w ? '' : ' dim') + '">' + esc(w || '点一下，写下想加的下一样') + '</div>' +
'</div>';
}

function editWish() {
modal({
title: '待开发 · 想加的下一样',
body: '<input type="text" id="wishIn" maxlength="60" placeholder="比如：把书单导出成一张长图" value="' +
esc(S.db.meta.wish || '') + '">' +
'<div class="vw-form-tip">留空就只是四个字「待开发」；写上了，卡片上就一直提醒你</div>',
foot: '<button class="btn" data-close>算了</button>' +
'<button class="btn primary" data-act="wish-save">记下</button>',
focus: '#wishIn'
});
}

function cardData(id) {
var db = S.db, st = S.stats(), m = MOD[id];

var d = { id: id, m: m, line: '', line2: '', count: '', time: '', dim: false };
if (id === 'notes') {
var last = S.liveNotes().slice().sort(function (a, b) { return b.createdAt - a.createdAt; })[0];
if (last) {
d.line = (last.book ? '《' + last.book + '》' : '') + clip(last.content, 34);
d.time = fmtTime(last.createdAt);
} else {
d.line = '把读到的一句抄进来，再写下自己的判断';
d.dim = true;
}
d.line2 = '共 ' + st.notes + ' 条 · ' + st.cases + ' 条案评' +
(st.noCase ? ' · ' + st.noCase + ' 条还没写案评' : '');
} else if (id === 'books') {
var read = db.books.filter(function (b) { return b.status === 'reading'; })
.sort(function (a, b) { return String(b.start || '').localeCompare(String(a.start || '')); })[0];
var doneLast = db.books.filter(function (b) { return b.status === 'done'; })
.sort(function (a, b) { return String(b.finish || '').localeCompare(String(a.finish || '')); })[0];
var bk = read || doneLast;
if (bk) {
d.line = (read ? '在读《' : '读完《') + bk.title + '》' + (bk.author ? ' · ' + bk.author : '');
} else {
d.line = '添一本正在读的，读完了点圆圈入库';
d.dim = true;
}
d.line2 = '在读 ' + st.reading + ' 本 · 已读完 ' + st.done + ' 本 · 今年 ' + st.readYear + ' 本';
d.count = '共 ' + st.books + ' 本';
} else if (id === 'chronicle') {
var latest = db.timeline.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
if (latest) {
d.line = clip(latest.title, 34);
d.time = latest.date || '';
} else {
d.line = '读完了书、办完了事，这里会自动落一笔';
d.dim = true;
}
d.line2 = '今年记下 ' + st.tlYear + ' 件 · 共 ' + st.timeline + ' 条';
d.count = '共 ' + st.timeline + ' 条';
} else if (id === 'diary') {
var days = Object.keys(db.diary).sort();
var lastDay = days[days.length - 1];
var page = lastDay ? db.diary[lastDay] : null;
if (page && String(page.text || '').trim()) {
d.line = clip(page.text, 34);
d.time = lastDay;
} else {
d.line = '今天这一页还空着，写一句也好';
d.dim = true;
}
d.line2 = '已写 ' + st.diary + ' 页' + (lastDay ? ' · 上次 ' + lastDay.slice(5) + '（' + dayLabel(lastDay) + '）' : '');
} else if (id === 'ledger') {
var lastOne = db.ledger.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })[0];
if (lastOne) {
d.line = (lastOne.type === 'in' ? '收入 · ' : '支出 · ') +
(lastOne.note ? clip(lastOne.note, 18) : (lastOne.category || '其他')) +
' ' + money(lastOne.amount);
d.time = lastOne.date || '';
} else {
d.line = '记第一笔，月底才知道钱去了哪儿';
d.dim = true;
}
d.line2 = '本月支出 ' + money(st.ledgerOut) + ' · 收入 ' + money(st.ledgerIn);
d.count = '共 ' + db.ledger.length + ' 笔';
} else if (id === 'docs') {
d.count = st.docs ? (st.docs + ' 篇') : '还没有文档';
var lastDoc = db.docs.slice().sort(function (a, b) { return b.ts - a.ts; })[0];
if (lastDoc) {
d.line = '《' + lastDoc.title + '》' + (lastDoc.content ? ' · ' + clip(lastDoc.content, 20) : '');
d.time = fmtTime(lastDoc.ts);
} else {
d.line = '书稿、长文都放这儿，跟着书案一起搬';
d.dim = true;
}
d.line2 = st.docs + ' 篇 · 约 ' + st.docChars.toLocaleString('zh-CN') + ' 字';
} else if (id === 'beach') {

var links = db.links.slice().sort(function (a, b) {
if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
var x = String(a.lastAt || a.at || ''), y = String(b.lastAt || b.at || '');
return x > y ? -1 : (x < y ? 1 : 0);
});
var lastLink = links[0];
var pinnedN = links.filter(function (x) { return x.pinned; }).length;
if (lastLink) {
d.line = lastLink.name + (lastLink.note ? ' · ' + clip(lastLink.note, 20) : (lastLink.host ? ' · ' + lastLink.host : ''));
d.time = lastLink && (lastLink.lastAt || lastLink.at) ? fmtTime(Date.parse(lastLink.lastAt || lastLink.at)) : '';
} else {
d.line = '把常去、又不用登录的站收进来';
d.dim = true;
}
d.line2 = st.links + ' 个网址' + (pinnedN ? ' · 钉住 ' + pinnedN + ' 条' : '');
d.count = pinnedN ? '钉住 ' + pinnedN + ' 条' : '';
} else if (id === 'words') {
var tw = S.todayWord();
if (tw) {
d.line = tw.w + (tw.mean ? ' · ' + clip(tw.mean, 22) : '');
d.time = '';
} else {
d.line = '一天一个词，先拾一个进来';
d.dim = true;
}
d.line2 = '共 ' + st.words + ' 个' + (st.wordsDue ? ' · 待复习 ' + st.wordsDue + ' 个' : '') +
(st.wordsMastered ? ' · 烂熟 ' + st.wordsMastered : '');
d.count = st.words ? '今日一词' : '';
} else if (id === 'site') {
var ps = db.site.posts.slice().sort(function (a, b) { return b.at - a.at; })[0];
if (ps) {
d.line = clip(ps.text, 34);
d.time = fmtTime(ps.at);
} else {
d.line = '碎碎念、简介，攒成一页能给外人看的站';
d.dim = true;
}
d.line2 = '碎碎念 ' + st.posts + ' 条' + (db.site.about.title ? ' · ' + db.site.about.title : '');
}
return d;
}

function todayItems() {
var db = S.db, t = S.today();
var out = [];
db.todos.filter(function (x) { return !x.done; }).forEach(function (x) {
var due = x.due ? String(x.due).slice(0, 10) : '';
if (due && due < t) {

var late = Math.round((new Date(t + 'T12:00:00') - new Date(due + 'T12:00:00')) / 86400000);
out.push({ p: 0, tag: '逾期 ' + late + ' 天', text: x.text, id: x.id, todo: true });
} else if (due === t) {
out.push({ p: 1, tag: '今天到期', text: x.text, id: x.id, todo: true });
} else if (x.cat === 'important') {
out.push({ p: 2, tag: '重要', text: x.text, id: x.id, todo: true });
}
});
var page = db.diary[t];
if (!page || !String(page.text || '').trim()) {
out.push({ p: 3, tag: '还没写', text: '今天这一页还空着', id: 'diary', todo: false });
}
var reading = (db.books || []).filter(function (b) { return b.status === 'reading'; });
if (reading.length) {
out.push({
p: 4, tag: '在读',
text: reading[0].title + (reading.length > 1 ? ' 等 ' + reading.length + ' 本' : ''),
id: 'books', todo: false
});
}
return out.sort(function (a, b) { return a.p - b.p; });
}

function todayStripHtml() {
var items = todayItems();
var head = '<div class="ts-h">今天</div>';
var body = items.length
? items.slice(0, 4).map(function (it) {

return '<button class="ts-item p' + it.p + '"' +
(it.todo ? ' data-act="todo-toggle" data-id="' + esc(it.id) + '" title="点一下就是办完了"'
: ' data-act="open" data-id="' + esc(it.id) + '" title="点开看看"') + '>' +
(it.todo ? '<span class="ts-tick"></span>' : '<span class="ts-go">›</span>') +
'<span class="ts-k">' + esc(it.tag) + '</span>' +
'<span class="ts-t">' + esc(it.text) + '</span></button>';
}).join('') + (items.length > 4 ? '<span class="ts-more">还有 ' + (items.length - 4) + ' 件在右边</span>' : '')
: '<span class="ts-more">眼下没有非做不可的事</span>';
return '<div class="today-strip' + (items.some(function (it) { return it.todo; }) ? ' has-hard' : ' off') +
'" id="todayStrip">' +
head + '<div class="ts-list">' + body + '</div></div>';
}

function renderTodayStrip() {
var el = $('#todayStrip');
if (el) el.outerHTML = todayStripHtml();
}

function tagsWallHtml() {
var tags = S.tagIndex ? S.tagIndex() : [];
if (!tags.length) return '';
return '<div class="tagwall">' +
'<div class="tagwall-h"><span class="tagwall-k">标签</span>' +
'<span class="tagwall-d">正文里写 #话题，就会长在这里</span></div>' +
'<div class="tagwall-list">' + tags.slice(0, 18).map(function (t) {
return '<button type="button" class="tagchip" data-act="tag-open" data-tag="' + esc(t.tag) + '">' +
'<span class="tagchip-t">#' + esc(t.tag) + '</span>' +
'<span class="tagchip-n">' + t.n + '</span></button>';
}).join('') + '</div></div>';
}

function renderOverview() {
var pane = $('#pane-overview');
var db = S.db, st = S.stats();

var qk = qkKind();
qkCur = qk;
var now = new Date();
var se = season();
var order = db.meta.cardOrder.length ? db.meta.cardOrder.filter(function (x) { return MOD[x]; }) : MODULES.map(function (m) { return m.id; });
MODULES.forEach(function (m) { if (order.indexOf(m.id) < 0) order.push(m.id); });

var week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];

var stats = [
{ k: '笔记', v: st.notes, id: 'notes', color: '#a8442a' },
{ k: '日记', v: st.diary, id: 'diary', color: '#a5804a' },
{
k: '码字', v: st.docChars >= 10000 ? (st.docChars / 10000).toFixed(1) + '万' : st.docChars,
id: 'docs', color: '#6b5b95', title: '书稿共约 ' + st.docChars.toLocaleString('zh-CN') + ' 字 · 打开我的文档'
},
{ k: '今日', v: st.todayChars, color: '#8a3f5c', title: '今天新增的字数：书稿净增 + 日记 + 笔记' },
{ k: '读完', v: st.readYear, id: 'books', color: '#3f6b7d', title: '今年读完 ' + st.readYear + ' 本 · 打开藏书阁' }
];

pane.innerHTML =
'<div class="view overview">' +

'<button class="theme-btn" id="themeBtn" title="界面主题"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="5.6"/><path d="M8 2.4a5.6 5.6 0 0 0 0 11.2z" fill="currentColor" stroke="none"/></svg></button>' +
'<div class="theme-menu" id="themeMenu">' +
'  <div class="tm-sec">明 暗</div>' +
'  <div class="modes"><button data-act="mode" data-mode="auto">跟随</button><button data-act="mode" data-mode="light">浅色</button><button data-act="mode" data-mode="dark">深色</button></div>' +
'  <div class="tm-sec mt">纸 色</div>' +
'  <div class="swatches" id="swatches"></div>' +
'  <div class="tm-sec mt">自 定 纸 色</div>' +
'  <div class="tm-custom">' +
'    <label title="纸面本色"><input type="color" id="tmBase">纸面</label>' +
'    <label title="落款色 / 印色"><input type="color" id="tmAccent">印色</label>' +
'  </div>' +
'  <div class="tm-tip">挑两个色就是一张新纸 —— 墨色与界线由程序按对比度推，保证读得清。</div>' +
'  <button class="tm-reset" data-act="theme-reset">恢复默认（宣纸 · 跟随系统）</button>' +
'</div>' +

'<div class="ov-head">' +

'  <div class="era-line">' +
'<span class="gz-full" title="天干地支：年以立春为界，月按节气月建，日为六十甲子">' +
gzYear(now) + '年 ' + gzMonth(now) + '月 ' + gzDay(now) + '日</span>' +
'<span class="hs" title="智人纪年第 ' + sapiensYear(now) + ' 年 · 以约 30 万年前为元年">智人纪年 ' +
'<span class="hs-n">' + String(sapiensYear(now)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</span> 年</span>' +
'</div>' +
'  <div class="date-line" title="' + now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + week + '">' +
'<span class="d-main">' + (now.getMonth() + 1) + '月' + now.getDate() + '日</span>' +
'    <span class="season">· 星期' + week + ' · ' + se.name + '日</span></div>' +
greetingHtml() +
'</div>' +
qkBar(qk) +
'<div class="sort-tip hidden" id="sortTip"><span class="k">排一排</span>' +
'  <span>拖动卡片换位置 · 松手就记住</span>' +
'  <button class="btn" data-act="sort-done">排好了</button>' +
'  <button class="btn ghost" data-act="sort-reset">恢复原序</button></div>' +
'<div class="grid" id="cardGrid">' + gridCardsHtml(order) + '</div>' +
tagsWallHtml() +
'</div>';

renderSwatches();
markMode();
renderTodo();
wireTheme();
wireCards();
wireChq();
}

var TALL = { notes: 1, books: 1, chronicle: 1, diary: 1, ledger: 1, words: 1, todo: 1 };

function daysSince(d) {
if (!d) return -1;
var t = Date.parse(String(d).slice(0, 10) + 'T00:00:00');
if (!isFinite(t)) return -1;
var today0 = Date.parse(S.today() + 'T00:00:00');
return Math.round((today0 - t) / 86400000);
}

function artEmpty(t) { return '<div class="art-empty">' + esc(t) + '</div>'; }

function shortMoney(n) {
n = Number(n) || 0;
if (n >= 10000) return '¥' + (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
if (n >= 1000) return '¥' + Math.round(n).toLocaleString('zh-CN');
return '¥' + (Math.round(n * 100) / 100);
}

function artNotes() {
var list = S.liveNotes().slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
var n = list[0];
if (!n) return artEmpty('还没有摘抄');
var cases = (n.caseNotes || []).length;
return '<div class="art-quote">' + esc(n.content) + '</div>' +
'<div class="art-quote-sub">' + (cases
? '案评 <b>' + cases + '</b> 条'
: '<span class="dim">这一条还没写案评</span>') +
(n.source ? '<span class="art-src">' + esc(n.source) + '</span>' : '') + '</div>';
}

function artBooks() {
var rs = S.db.books.filter(function (b) { return b.status === 'reading'; })
.sort(function (a, b) { return String(a.start || '') < String(b.start || '') ? -1 : 1; })
.slice(0, 3);
if (!rs.length && !S.db.books.length) return artEmpty('藏书阁还是空的');

var fill = [];
if (rs.length < 3) {
fill = S.db.books.filter(function (b) { return b.status === 'done'; })
.sort(function (a, b) { return String(b.finish || '') < String(a.finish || '') ? -1 : 1; })
.slice(0, 3 - rs.length);
}
function row(title, right, dim) {
return '<div class="art-row' + (dim ? ' dim' : '') + '"><span class="art-row-t">《' + esc(title) + '》</span>' +
'<span class="art-row-v">' + esc(right) + '</span></div>';
}
return '<div class="art-rows">' +
rs.map(function (b) {
var d = daysSince(b.start);
return row(b.title, d >= 0 ? '上书 ' + d + ' 天' : '在读');
}).join('') +
fill.map(function (b) { return row(b.title, '读完', true); }).join('') +
'</div>';
}

function ledMonthOf() {
var cur = S.today().slice(0, 7);
var months = {};
S.db.ledger.forEach(function (x) {
var ym = String(x.date).slice(0, 7);
months[ym] = (months[ym] || 0) + 1;
});
var ym = Object.keys(months).sort().pop() || cur;
return { ym: ym, isCur: ym === cur };
}

function artLedger() {
if (!S.db.ledger.length) return artEmpty('还没有记过账');

var lm = ledMonthOf(), ym = lm.ym, isCur = lm.isCur;
var out = 0, inn = 0, cats = {};
S.db.ledger.forEach(function (x) {
if (String(x.date).slice(0, 7) !== ym) return;
if (x.type === 'in') { inn += x.amount; return; }
out += x.amount;
cats[x.category || '其他'] = (cats[x.category || '其他'] || 0) + x.amount;
});
var total = Math.max(out, inn, 1);
var pct = Math.min(1, out / total);
var R = 26, C = 2 * Math.PI * R;
var top = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 2);
return '<div class="art-donut">' +
'<svg viewBox="0 0 64 64" aria-hidden="true">' +
'<circle class="dk-bg" cx="32" cy="32" r="' + R + '"/>' +
'<circle class="dk-fg" cx="32" cy="32" r="' + R + '" ' +
'stroke-dasharray="' + (C * pct).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg>' +
'<div class="dk-c"><b>' + shortMoney(out) + '</b><span>' +
(isCur ? '本月支出' : ym.slice(5) + ' 月支出') + '</span></div>' +
'</div>' +
(top.length
? '<div class="art-rows">' + top.map(function (k) {
return '<div class="art-row"><span class="art-row-t">' + esc(k) + '</span>' +
'<span class="art-row-v">' + shortMoney(cats[k]) + '</span></div>';
}).join('') + '</div>'
: '<div class="art-rows"><div class="art-row"><span class="art-row-t">收入</span>' +
'<span class="art-row-v">' + shortMoney(inn) + '</span></div></div>');
}

function artDiary() {
var t = S.today(), ym = t.slice(0, 7);
var first = new Date(ym + '-01T00:00:00');
var lead = first.getDay();
var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
var cells = '';
for (var i = 0; i < lead; i++) cells += '<i class="off"></i>';
for (var d = 1; d <= days; d++) {
var k = ym + '-' + pad(d);
var has = !!S.db.diary[k];
cells += '<i class="' + (has ? 'has' : '') + (k === t ? ' today' : '') + '"></i>';
}

return '<div class="art-calhead"><b>' + (first.getMonth() + 1) + ' 月</b></div>' +
'<div class="art-cal">' + cells + '</div>';
}

function artChronicle() {
var list = S.db.timeline.slice()
.sort(function (a, b) { return String(a.date) < String(b.date) ? 1 : -1; })
.slice(0, 3);
if (!list.length) return artEmpty('还没有记过大事');
return '<div class="art-rows">' + list.map(function (x) {
return '<div class="art-row"><span class="art-row-t">' + esc(x.title) + '</span>' +
'<span class="art-row-v">' + esc(String(x.date || '').slice(5)) + '</span></div>';
}).join('') + '</div>';
}

function artWords() {
var w = S.todayWord();
if (!w) return artEmpty('还没有词');
return '<div class="art-word">' + esc(w.w) + '</div>' +
(w.ph ? '<div class="art-ph">' + esc(w.ph) + '</div>' : '') +
'<div class="art-mean">' + esc(w.mean || '（还没写释义）') + '</div>';
}

function artBeach() {
var ls = S.db.links.slice().sort(function (a, b) {
var x = String(a.lastAt || a.at || ''), y = String(b.lastAt || b.at || '');
if (x !== y) return x > y ? -1 : 1;
return (b.hits || 0) - (a.hits || 0);
}).slice(0, 3);
if (!ls.length) return artEmpty('沙滩还是空的');
return '<div class="art-rows">' + ls.map(function (l) {
var name = l.name || '';
if (!name) { try { name = new URL(l.url).hostname.replace(/^www\./, ''); } catch (e) { name = l.url || ''; } }
return '<div class="art-row"><span class="art-row-t">' + esc(name) + '</span>' +
'<span class="art-row-v">' + (l.hits ? '开过 ' + l.hits + ' 次' : '') + '</span></div>';
}).join('') + '</div>';
}

function cardArt(id) {
if (id === 'notes') return artNotes();
if (id === 'books') return artBooks();
if (id === 'ledger') return artLedger();
if (id === 'diary') return artDiary();
if (id === 'chronicle') return artChronicle();
if (id === 'words') return artWords();
if (id === 'beach') return artBeach();
return '';
}

function cardMeta(id) {
var st = S.stats();
if (id === 'notes') return '共 ' + st.notes + ' 条 · ' + st.cases + ' 条案评';
if (id === 'books') return '在读 ' + st.reading + ' · 读完 ' + st.done + ' · 今年 ' + st.readYear;
if (id === 'ledger') {

var lm = ledMonthOf(), m = lm.ym, n = 0, o = 0, i2 = 0;
S.db.ledger.forEach(function (x) {
if (String(x.date).slice(0, 7) !== m) return;
n++; if (x.type === 'in') i2 += x.amount; else o += x.amount;
});
return (lm.isCur ? '本月 ' : Number(m.slice(5)) + ' 月 ') + n + ' 笔 · 结余 ' + money(i2 - o);
}
if (id === 'diary') return '共 ' + st.diary + ' 页';
if (id === 'chronicle') return '今年 ' + st.tlYear + ' 件 · 共 ' + st.timeline + ' 条';
if (id === 'words') return '共 ' + st.words + ' 词 · 待复习 ' + st.wordsDue;
if (id === 'beach') return st.links + ' 个网址' + (function () {
var p = S.db.links.filter(function (x) { return x.pinned; }).length;
return p ? ' · 钉住 ' + p : '';
})();
return '';
}

function gridCardsHtml(order) {

return order.map(cardHtml).join('') + todoCardHtml() + wishCardHtml();
}

function todoCardHtml() {

return '<div class="card todo-card light" data-todo="1" tabindex="0" role="group" ' +
'aria-label="案头待办" style="--tint:#f1ece2;--tint-hover:#e5e1d7;' +
'--tint-dark:#4b4740;--tint-dark-hover:#534f48">' +
'<div class="card-top"><div class="card-seal">办</div>' +
'<div class="card-h"><div class="card-title">案头待办</div>' +
'<div class="card-desc">今天该做的事</div></div></div>' +
'<div class="todo-inner" id="todoRail"></div>' +
'</div>';
}

function cardHtml(id) {
var d = cardData(id);
var m = d.m;
var art = cardArt(id);

return '<div class="card' + (art ? ' has-art' : '') + (TALL[id] ? ' tall' : '') +
(m.ink === 'dark' ? ' light' : '') +
'" data-id="' + id + '" draggable="false" tabindex="0" role="button" ' +
'aria-label="' + esc(m.name) + '：' + esc(m.desc) + '" ' +
'title="' + esc(m.tn || m.name) + '" ' +
'style="--tint:' + m.color + ';--tint-hover:' + m.colorHover +
';--tint-dark:' + m.colorDark + ';--tint-dark-hover:' + m.colorDarkHover + '">' +
'<div class="card-top"><div class="card-seal">' + m.glyph + '</div>' +
'<div class="card-h"><div class="card-title">' + esc(m.name) + '</div><div class="card-desc">' + esc(m.desc) + '</div></div></div>' +
(art
? '<div class="card-art">' + art + '</div>' +
'<div class="card-meta"><span>' + esc(cardMeta(id)) + '</span><span>' + esc(d.time || '') + '</span></div>'
: '<div class="card-body"><div class="line' + (d.dim ? ' dim' : '') + '">' + esc(d.line) + '</div>' +
(d.line2 ? '<div class="line2">' + esc(d.line2).replace(/(\d[\d,]{1,})/g, '<span class="n">$1</span>') + '</div>' : '') + '</div>' +
'<div class="card-meta"><span>' + esc(d.count || '') + '</span><span>' + esc(d.time || '') + '</span></div>') +
'</div>';
}

function wireTheme() {
var btn = $('#themeBtn');
var menu = $('#themeMenu');
if (!btn) return;
btn.addEventListener('click', function (e) {
e.stopPropagation();
menu.classList.toggle('open');
});

if (!wireTheme._closer) {
wireTheme._closer = true;
document.addEventListener('click', function (e) {
var m = $('#themeMenu');
if (m && m.classList.contains('open') &&
!e.target.closest('#themeMenu') && !e.target.closest('#themeBtn')) {
m.classList.remove('open');
}
});
}
var base = $('#tmBase'), acc = $('#tmAccent');
var push = function () {
setTheme({ tint: T.CUSTOM, custom: { base: base.value, accent: acc.value } });
};
base.addEventListener('input', push);
acc.addEventListener('input', push);
}

function chqDateLabel(v) {
var t = S.today();
if (!v || v === t) return '今天';
var p = String(v).split('-');
if (p.length !== 3) return String(v);
var y = Number(p[0]), m = Number(p[1]), d = Number(p[2]);
if (!y || !m || !d) return String(v);
return (y !== new Date().getFullYear() ? y + '年' : '') + m + '月' + d + '日';
}
function syncChqDate() {
var d = $('#chqDate'), tx = $('#chqDateTx');
if (d && tx) tx.textContent = chqDateLabel(d.value);
}

var QK_KINDS = [

{ id: 'ledger', ch: '账', tip: '记一笔账',
ph: '备注', phL: '备注，可留空 · 回车就记下' },
{ id: 'note', ch: '句', tip: '写一条读书笔记',
ph: '读到哪一句', phL: '读到哪一句？回车就摘下来' },
{ id: 'entry', ch: '事', tip: '记一件大事',

ph: '什么事值得记下', phL: '今天有什么事值得记下？按回车就记下' }
];

var qkCur = 'note';

var QK_CATS_SEED = ['餐饮', '交通', '购物', '居住', '通信', '其他'];

function qkCats() {
var seen = {}, count = {}, out = [];
var add = function (c) {
c = String(c || '').trim();
if (!c || seen[c]) return;
seen[c] = 1; out.push(c);
};
S.db.ledger.forEach(function (x) {
if (x.category) count[x.category] = (count[x.category] || 0) + 1;
});
Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).forEach(add);
if (out.length < 4) QK_CATS_SEED.forEach(add);
if (!out.length) out.push('其他');
return out;
}

function qkKind() {
var mk = S.db.meta.quickKind;
if (mk === 'ledger' || mk === 'note' || mk === 'entry') return mk;
var cut = S.daysAgo(6);

var cutMs = Date.now() - 6 * 86400000;
var n = { ledger: 0, note: 0, entry: 0 };
S.db.ledger.forEach(function (x) {
if (String(x.date || '').slice(0, 10) >= cut) n.ledger++;
});
S.liveNotes().forEach(function (x) {
if ((x.createdAt || 0) >= cutMs) n.note++;
});
S.db.timeline.forEach(function (x) {
if (String(x.date || '').slice(0, 10) >= cut) n.entry++;
});
var best = 'note';
if (n.entry > n[best]) best = 'entry';
if (n.ledger > n[best]) best = 'ledger';
return best;
}

function qkBar(k) {
var d = QK_KINDS[1];
QK_KINDS.forEach(function (x) { if (x.id === k) d = x; });
var cats = qkCats(), cur = S.db.meta.quickCat;
if (cats.indexOf(cur) < 0) cur = cats[0];
var led = k === 'ledger';
return '<div class="ch-quick" id="chQuick">' +
'<div class="chq-kinds" role="group" aria-label="记哪一种">' +
QK_KINDS.map(function (x) {
return '<button type="button" class="chq-k' + (x.id === k ? ' on' : '') + '"' +
' data-act="chq-kind" data-k="' + x.id + '" title="' + x.tip + '"' +
' aria-pressed="' + (x.id === k ? 'true' : 'false') + '">' + x.ch + '</button>';
}).join('') +
'</div>' +

'<span class="chq-date-wrap' + (k === 'entry' ? '' : ' hidden') + '" id="chqDateWrap">' +
'  <span class="chq-date-tx" id="chqDateTx">今天</span>' +
'  <input type="date" id="chqDate" value="' + S.today() + '" title="哪一天的事" aria-label="哪一天的事">' +
'</span>' +
'<input type="text" id="chqTitle" maxlength="80" placeholder="' + esc(S.narrow() ? d.ph : d.phL) + '">' +
'<label class="chq-amt' + (led ? '' : ' hidden') + '" id="chqAmtWrap" title="金额">' +
'  <span aria-hidden="true">¥</span>' +
'  <input type="number" id="chqAmt" min="0" step="0.01" inputmode="decimal" placeholder="金额" aria-label="金额" autocomplete="off">' +
'</label>' +
'<select class="chq-cat' + (led ? '' : ' hidden') + '" id="chqCat" aria-label="分类">' +
cats.map(function (c) {
return '<option' + (c === cur ? ' selected' : '') + '>' + esc(c) + '</option>';
}).join('') +
'</select>' +
'<button class="chq-save" data-act="chq-save">记下</button>' +
'</div>';
}

function paintChq(k) {
var box = $('#chQuick');
if (!box) return;
$$('.chq-k', box).forEach(function (b) {
var on = b.dataset.k === k;
b.classList.toggle('on', on);
b.setAttribute('aria-pressed', on ? 'true' : 'false');
});
var led = k === 'ledger';
var aw = $('#chqAmtWrap'), cw = $('#chqCat'), dw = $('#chqDateWrap'), t = $('#chqTitle');
if (aw) aw.classList.toggle('hidden', !led);
if (cw) cw.classList.toggle('hidden', !led);
if (dw) dw.classList.toggle('hidden', k !== 'entry');
if (t) {
var d = QK_KINDS[1];
QK_KINDS.forEach(function (x) { if (x.id === k) d = x; });
t.placeholder = S.narrow() ? d.ph : d.phL;
}
}

function wireChq() {
var inp = $('#chqTitle');
if (!inp) return;
inp.addEventListener('keydown', function (e) {
if (e.key === 'Enter') { e.preventDefault(); saveChq(); }
});

var amt = $('#chqAmt');
if (amt) amt.addEventListener('keydown', function (e) {
if (e.key === 'Enter') { e.preventDefault(); saveChq(); }
});
var d = $('#chqDate');
if (d) d.addEventListener('change', syncChqDate);
syncChqDate();
paintChq(qkCur);
}
function saveChq() {
var t = $('#chqTitle'), d = $('#chqDate');
var txt = t ? t.value.trim() : '';
var k = qkCur;
if (k === 'ledger') {
var a = $('#chqAmt');
var amt = a ? parseFloat(a.value) : NaN;
if (!isFinite(amt) || amt <= 0) {
toast('先填个金额，再记这一笔');
if (a) a.focus();
return;
}
var c = $('#chqCat');
var cat = (c && c.value) || '其他';
var x = S.addLedger({ amount: amt, date: S.today(), type: 'out', category: cat, sub: '', note: txt });
if (!x) { toast('这一笔没记上，金额再看一眼'); if (a) a.focus(); return; }
if (S.db.meta.quickCat !== cat) { S.db.meta.quickCat = cat; S.save(); }
if (a) a.value = '';
if (t) t.value = '';
if (a) a.focus();
toast('记下了 · ' + cat + ' ' + money(amt));
refreshOverviewSoft();
return;
}
if (!txt) {
toast(k === 'note' ? '写一句，再存' : '写一句，再记');
if (t) t.focus();
return;
}
if (k === 'note') {
S.addNote({ content: txt });
toast('记下了 · 摘了一句');
} else {
S.addEntry({ title: txt, date: (d && d.value) || S.today() });
toast('记下了 · 大事记');
}
if (t) { t.value = ''; t.focus(); }
refreshOverviewSoft();
}

function wireCards() {
var grid = $('#cardGrid');
if (!grid) return;

grid.addEventListener('keydown', function (e) {
if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
var card = e.target.closest && e.target.closest('.card[data-id]');
if (!card || e.target !== card) return;
e.preventDefault();
openModule(card.dataset.id);
});

grid.addEventListener('click', function (e) {
if (sorting) return;
if (e.target.closest('.wish-card')) { editWish(); return; }

if (e.target.closest('.todo-card')) return;
var card = e.target.closest('.card');
if (!card) return;
openModule(card.dataset.id);
});
if (sorting) armDrag();
}

var dragId = null;
function armDrag() {
var grid = $('#cardGrid');
if (!grid) return;
grid.classList.add('sorting');
$$('.card:not(.wish-card):not(.todo-card)', grid).forEach(function (card) {
card.draggable = true;
card.addEventListener('dragstart', function (e) {
dragId = card.dataset.id;
card.classList.add('dragging');
e.dataTransfer.effectAllowed = 'move';
try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {}
});
card.addEventListener('dragend', function () {
card.classList.remove('dragging');
clearDrops();
});
card.addEventListener('dragover', function (e) {
e.preventDefault();
if (!dragId || dragId === card.dataset.id) return;
var r = card.getBoundingClientRect();
var before = (e.clientX - r.left) < r.width / 2;
clearDrops();
card.classList.add(before ? 'drop-before' : 'drop-after');
});
card.addEventListener('drop', function (e) {
e.preventDefault();
var target = card.dataset.id;
if (!dragId || dragId === target) return;
var r = card.getBoundingClientRect();
var before = (e.clientX - r.left) < r.width / 2;
moveCard(dragId, target, before);
});
});
}
function clearDrops() {
$$('.card').forEach(function (c) { c.classList.remove('drop-before', 'drop-after'); });
}
function moveCard(id, target, before) {
var order = S.db.meta.cardOrder.length ? S.db.meta.cardOrder.slice() : MODULES.map(function (m) { return m.id; });
order = order.filter(function (x) { return x !== id; });
var at = order.indexOf(target);
if (at < 0) at = order.length;
order.splice(before ? at : at + 1, 0, id);
S.db.meta.cardOrder = order;
S.save();
dragId = null;
renderOverview();
markSortUI();
sorting = true;
renderSorting();
renderRail();
}
function renderSorting() {
var grid = $('#cardGrid'), tip = $('#sortTip');
if (grid) grid.classList.add('sorting');
if (tip) tip.classList.remove('hidden');
armDrag();

$$('.card:not(.wish-card):not(.todo-card)').forEach(function (c) { c.draggable = true; });
}
function markSortUI() {
var tip = $('#sortTip');
if (tip) tip.classList.toggle('hidden', !sorting);
}
function enterSort() {
sorting = true;
renderOverview();
renderSorting();
markSortUI();
toast('拖动卡片换位置，排完点「排好了」');
}
function exitSort() {
sorting = false;
renderOverview();
toast('顺序记住了');
}

var tdDoneOpen = false;

var tdDrafts = {};

var TD_CATS = [
{ id: 'urgent', name: '紧急', empty: '眼下没有急事' },
{ id: 'important', name: '重要', empty: '没有要紧的事' }
];
function tdParse(s) {
var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(s || ''));
return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}
function tdIsLate(due) { var d = tdParse(due); return !!d && d.getTime() < Date.now(); }
function tdDayGap(a, b) {
var x = new Date(a.getFullYear(), a.getMonth(), a.getDate());
var y = new Date(b.getFullYear(), b.getMonth(), b.getDate());
return Math.round((x - y) / 86400000);
}
function tdDueLabel(due) {
if (!due) return '＋ 定时间';
var d = tdParse(due);
if (!d) return '＋ 定时间';
var now = new Date();
if (d.getTime() < now.getTime()) {
var mins = Math.floor((now - d) / 60000);
if (mins < 60) return '逾期 ' + Math.max(1, mins) + ' 分';

var dGap = tdDayGap(now, d);
if (dGap >= 1) return '逾期 ' + dGap + ' 天';
return '逾期 ' + Math.floor(mins / 60) + ' 小时';
}
var hh = pad(d.getHours()) + ':' + pad(d.getMinutes());
var gap = tdDayGap(d, now);
if (gap === 0) return '今天 ' + hh;
if (gap === 1) return '明天 ' + hh;
if (gap === 2) return '后天 ' + hh;
return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + hh;
}
function tdItem(it) {
var sub = [];
if (!it.done && it.cat === 'urgent') {
sub.push('<button class="td-due' + (it.due ? (tdIsLate(it.due) ? ' late' : '') : ' none') + '" data-act="todo-due" data-id="' + it.id + '" title="' +
(it.due ? '截止 ' + it.due.replace('T', ' ') : '给这条定个截止时间') + '">' + esc(tdDueLabel(it.due)) + '</button>');
}
if (it.done && it.doneAt) {
var dd = new Date(it.doneAt);
sub.push('<span class="td-when">' + pad(dd.getMonth() + 1) + '-' + pad(dd.getDate()) + ' 完成</span>');
}
return '<div class="td-item" data-id="' + it.id + '" draggable="' + (!it.done) + '">' +
'<button class="td-box' + (it.done ? ' on' : '') + '" data-act="todo-toggle" data-id="' + it.id + '"></button>' +
'<div class="td-main"><span class="td-text' + (it.done ? ' done' : '') + '" data-act="todo-edit" data-id="' + it.id + '" title="双击改字">' + esc(it.text) + '</span>' +
(sub.length ? '<div class="td-sub">' + sub.join('') + '</div>' : '') + '</div>' +
'<button class="td-del" data-act="todo-del" data-id="' + it.id + '" title="删除">×</button></div>';
}

function renderTodo() {
var rail = $('#todoRail');
if (!rail) return;
var db = S.db;
rail.classList.toggle('folded', !!db.todosCollapsed);
var open = db.todos.filter(function (t) { return !t.done; });
var done = db.todos.filter(function (t) { return t.done; });

var tdFocusCat = '';
$$('.td-add', rail).forEach(function (i) {

if (i.value) tdDrafts[i.dataset.cat] = i.value;
if (document.activeElement === i) tdFocusCat = i.dataset.cat;
});
var group = function (c) {
var mine = open.filter(function (t) { return t.cat === c.id; });
return '<div class="td-group" data-cat="' + c.id + '">' +
'<div class="td-ghead"><span class="td-dot"></span><span class="td-gname">' + c.name + '</span>' +
'<span class="td-gcount">' + (mine.length || '') + '</span></div>' +

mine.map(tdItem).join('') +
'<input class="td-add" data-cat="' + c.id + '" maxlength="200" placeholder="＋ 添一件' + c.name + '的事…">' +
'</div>';
};
rail.innerHTML =
'<div class="td-head"><span class="td-title">案头待办</span>' +
'<button class="td-fold" data-act="todo-fold" title="收起（把地方让给卡片）">›</button></div>' +
'<div class="td-body">' + TD_CATS.map(group).join('') +
(done.length ? '<div class="td-done' + (tdDoneOpen ? ' open' : '') + '">' +
'<button class="td-done-head" data-act="todo-donefold">已完成 <span style="color:var(--ink-faint)">' + done.length + '</span> <span class="caret">▾</span></button>' +
'<div class="td-done-list">' + done.map(tdItem).join('') +
'<div class="td-done-more"><button class="td-done-clear" data-act="todo-cleardone">清空已完成</button></div></div></div>' : '') +
'</div>' +
'<button class="td-stub" data-act="todo-fold" title="展开待办">案头待办 <b>' + open.length + '</b></button>';

$$('.td-add', rail).forEach(function (inp) {

if (tdDrafts[inp.dataset.cat]) inp.value = tdDrafts[inp.dataset.cat];
if (tdFocusCat === inp.dataset.cat) {
try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } catch (err) { }
}
inp.addEventListener('input', function () { tdDrafts[inp.dataset.cat] = inp.value; });
inp.addEventListener('keydown', function (e) {
if (e.key !== 'Enter') return;
var v = inp.value.trim();
if (!v) return;
inp.value = '';

tdDrafts[inp.dataset.cat] = '';

S.addTodo(inp.dataset.cat, v);
renderTodo();
var again = $('.td-add[data-cat="' + inp.dataset.cat + '"]');
if (again) again.focus();
});
});

var id = null;
$$('.td-item', rail).forEach(function (el) {
el.addEventListener('dragstart', function (e) {
id = el.dataset.id;
el.classList.add('dragging');
e.dataTransfer.effectAllowed = 'move';
});
el.addEventListener('dragend', function () { el.classList.remove('dragging'); });
el.addEventListener('dragover', function (e) { e.preventDefault(); });
el.addEventListener('drop', function (e) {
e.preventDefault();
if (!id || id === el.dataset.id) return;
S.moveTodo(id, el.dataset.id);
renderTodo();
});
});
}

var duePopFor = null;
function openDuePop(el) {
var pop = $('#tdPop');
var it = S.db.todos.filter(function (t) { return t.id === el.dataset.id; })[0];
if (!it) return;
duePopFor = it.id;
var now = new Date();
var slots = [];
var at = function (off, h) { return new Date(now.getFullYear(), now.getMonth(), now.getDate() + off, h, 0); };
if (at(0, 18).getTime() > now.getTime()) slots.push({ l: '今天 18:00', v: S.localDT(at(0, 18)) });
slots.push({ l: '明天 09:00', v: S.localDT(at(1, 9)) });
slots.push({ l: '明天 18:00', v: S.localDT(at(1, 18)) });
slots.push({ l: '后天 09:00', v: S.localDT(at(2, 9)) });
pop.innerHTML = '<div class="td-pop-quick">' + slots.slice(0, 3).map(function (s) {
return '<button data-act="due-set" data-v="' + s.v + '">' + s.l + '</button>';
}).join('') + '</div>' +
'<input type="datetime-local" id="tdPopInput" value="' + (it.due || '') + '">' +
'<div class="td-pop-foot"><span>改完即存</span><button data-act="due-clear">清除时间</button></div>';
var r = el.getBoundingClientRect();
pop.classList.add('on');
var top = r.bottom + 6;
if (top + 130 > g.innerHeight) top = r.top - 132;
pop.style.top = Math.max(8, top) + 'px';
pop.style.left = Math.min(g.innerWidth - 240, Math.max(8, r.left - 40)) + 'px';
var inp = $('#tdPopInput');
inp.addEventListener('change', function () {
S.updateTodo(duePopFor, { due: inp.value });
closeDuePop(); renderTodo(); refreshOverviewSoft();
});
}
function closeDuePop() {
var pop = $('#tdPop');
if (pop) pop.classList.remove('on');
duePopFor = null;
}

function renderSync() {
var pane = ensurePane('sync');
var db = S.db, st = S.stats();
var size = 0;
try { size = (S.raw() || '').length; } catch (e) {}
var rows = [
['读书笔记', st.notes + ' 条 · ' + st.cases + ' 条案评'],
['关键词', st.keywords + ' 个'],
['藏书阁', st.books + ' 本（读完 ' + st.done + '）'],
['大事记', st.timeline + ' 条'],
['案头待办', db.todos.length + ' 件'],
['日记', st.diary + ' 页'],
['账本', db.ledger.length + ' 笔'],
['我的文档', st.docs + ' 篇 · ' + st.docChars + ' 字'],
['冲浪沙滩', st.links + ' 个'],
['读书录归档', db.meta.archive ? db.meta.archive.notes + ' 条（' + db.meta.archive.from + ' — ' + db.meta.archive.to + '）' : '未导入']
];

var cloudOn = !!(g.GZT_CLOUD && g.GZT_CLOUD.on);
var kb = Math.max(1, Math.round(size / 1024));

var headDesc = cloudOn
? '把所有数据打成一个 .json 包下载留底。数据存在<b>云端</b>：手机和电脑看到的是同一份，不用连同一个 WiFi，也不用这台电脑开着。'
: '把全部数据打成一个 .json 包，拷到另一台设备上还原 —— 笔记、案评、书、年表、待办、日记、账本、文档、网址都在里头。数据只存在你自己的浏览器里，不上传任何地方。';

var verCard = cloudOn
? '<div class="sync-card wide"><div class="sc-glyph">往</div>' +
'<div class="sc-main"><div class="sc-title">版本历史</div>' +
'<div class="sc-desc">服务端每次写入前自动留一份上一版，最多 50 份。误删或改错了，可以挑一版整体恢复；' +
'想长期留底仍建议用「导出全部数据」。<span class="sc-live" id="verLive"></span></div></div>' +
'<button class="btn sc-btn" data-act="ver-open">看看历史…</button></div>'
: '<div class="sync-card wide"><div class="sc-glyph">往</div>' +
'<div class="sc-main"><div class="sc-title">留个底</div>' +
'<div class="sc-desc">这个版本的数据只存在你自己的浏览器里，没有服务端历史。重要节点请用「导出全部数据」存一份 .json，换设备或清缓存后靠它还原。</div></div></div>';

var updCard = '<div class="sync-card"><div class="sc-glyph">新</div>' +
'<div class="sc-title">应用版本</div>' +
'<div class="sc-desc">当前 <b>#' + (g.__GZT_BUILD || '本地模式') + '</b>。' +
'改完看不到新界面时，按一下重新载入；手机上在底部「更多」里也有这一项。' +
'桌面图标最顶上那条<b>系统状态栏</b>是安装时定死的，改版后要删掉图标重新「添加到主屏幕」才立刻换新色（或等一两天自动更新）。' +
'<span class="sc-live" id="updState"></span></div>' +
'<button class="btn sc-btn" data-act="app-update">检查更新</button></div>';

var standalone = false;
try { standalone = !!(g.matchMedia && g.matchMedia('(display-mode: standalone)').matches); } catch (e) { }
var tcMeta = '(无)';
try {
var tcEl = document.querySelector('meta[name="theme-color"]');
if (tcEl) tcMeta = tcEl.getAttribute('content') || '(无)';
} catch (e) { }
var neutral = mbarWantsInk();

var installHtml;
if (deferredInstall) {
installHtml = '<button class="btn sc-btn" data-act="app-install">装到桌面（全屏、离线可用）</button>';
} else if (standalone) {
installHtml = '<div class="sc-desc">已是桌面图标方式打开。</div>';
} else {
var ua = String((g.navigator && g.navigator.userAgent) || '');
var isIOS = /iPad|iPhone|iPod/.test(ua) ||
!!((g.navigator && g.navigator.platform === 'MacIntel' && g.navigator.maxTouchPoints > 1));
installHtml = '<div class="sc-desc">想装到桌面：' +
(isIOS ? '点底部「分享」→「添加到主屏幕」' : '浏览器菜单 →「安装」或「添加到主屏幕」') +
'。装上之后是全屏打开、断网也能用。</div>';
}
var envCard = '<div class="sync-card"><div class="sc-glyph">境</div>' +
'<div class="sc-title">运行环境</div>' +
'<div class="sc-desc">打开方式：<b>' + (standalone ? '桌面图标（standalone）' : '浏览器标签') + '</b>' +
'　·　构建号 <b>#' + (g.__GZT_BUILD || '本地模式') + '</b><br>' +
'页面 theme-color：<b>' + esc(tcMeta) + '</b>（浏览器标签用）　·　' +
'清单 theme_color：<b>#f7f3ea</b>（桌面图标安装时写死）<br>' +
(standalone
? '状态栏由<b>安装时的那个壳</b>决定，网页改不了 —— 所以这里自动把应用栏做成<b>深色书脊</b>，跟它并成一段。删掉桌面图标重新「添加到主屏幕」，新壳才会用现在的纸色。'
: '状态栏由浏览器按 theme-color 绘制，本来就与纸面同色，应用栏保持纸色。') +
'</div>' +
'<button class="btn sc-btn" data-act="mbar-style">功能总览顶栏：' +
(neutral ? '深色书脊' : '纸色') + '　点一下切换</button>' + installHtml + '</div>';

var totalNote = cloudOn
? '合计约 <b>' + kb + '</b> KB（浏览器缓存一份 + 云端一份，两边自动保持一致）'
: '合计约 <b>' + kb + '</b> KB（只存在这个浏览器里，不上传）';

var syncNotes = cloudOn
? '<li>数据存在<b>云端</b>：在家里、在公司、用 4G，打开同一个网址都是同一份，不需要连这台电脑。</li>' +
'<li>任何一处改动都会写回云端；另一个页面开着时每 5 秒问一次，看到变化会自动跟上。</li>' +
'<li>正在输入框里打字、或这边还有没存上的改动时，<b>不会替你换内容</b> —— 顶部浮一条提示，点了才载入。</li>' +
'<li>两边同时改仍会互相覆盖（没有冲突合并）。在手机上动手前，先看这边是不是最新。</li>' +
'<li>服务端自动留最近 <b>50 份</b>历史，误删或改错了到「版本历史」挑一版恢复；重要节点仍建议导一次包。</li>'
: '<li>数据只存在<b>当前这个浏览器</b>里：笔记、书、日记、账本一改就保存在本机，刷新和关页都还在。</li>' +
'<li>换设备、换浏览器，或清掉浏览器数据时，需要先在「导出全部数据」里存一份 .json，再到新设备「从包还原」。</li>' +
'<li>还原会整份替换现有数据；只想补齐缺的条目，选「只补缺」。</li>' +
'<li>建议每隔一阵导出一次留底 —— 这个版本没有云端，也不会自动备份到任何地方。</li>';

pane.innerHTML =
'<div class="view"><div class="sync-wrap">' +
'<div class="sync-head"><h2>数据同步</h2><p>' + headDesc + '</p></div>' +
'<div class="sync-cards">' +
'  <div class="sync-card"><div class="sc-glyph">出</div><div class="sc-title">导出全部数据</div>' +
'    <div class="sc-desc">打成一个包下载下来，存 U 盘或发给自己都行。</div>' +
'    <button class="btn primary sc-btn" data-act="sync-export">导出…</button></div>' +
'  <div class="sync-card"><div class="sc-glyph">入</div><div class="sc-title">从包还原</div>' +
'    <div class="sc-desc">选一个数据包导进来。动手之前先让你看清包里有什么，可以选「只补缺」。</div>' +
'    <button class="btn sc-btn" data-act="sync-import">选包导入…</button>' +
'    <input type="file" id="syncFile" accept=".json,application/json" class="hidden"></div>' +
'  ' + verCard + updCard + envCard +
(cloudOn ? '<div class="sync-card"><div class="sc-glyph">钥</div><div class="sc-title">登录方式</div>' +
'<div class="sc-desc">现在是邮箱验证码登录。设一个密码之后，下次打开只要输邮箱和密码，' +
'不用再等邮件 —— 会话过期时省掉「发码、查收、输码」三步。</div>' +
'<button class="btn sc-btn" data-act="set-password">设置登录密码</button></div>' : '') +
'</div>' +
'<div class="sync-panel"><div class="sp-head"><span>' + (cloudOn ? '现在这份数据' : '这个浏览器里现有的数据') + '</span>' +
'<button class="sp-refresh" data-act="sync-refresh">刷新</button></div>' +
'<div class="sp-body">' + rows.map(function (r) {
return '<div class="sp-row"><span class="sp-name">' + r[0] + '</span><span class="sp-num">' + esc(r[1]) + '</span></div>';
}).join('') +
'<div class="sp-total">' + totalNote + '</div>' +
'</div></div>' +
'<div class="sync-note"><b>关于同步</b><ul>' + syncNotes + '</ul></div>' +
'</div></div>';

}

function exportAll() {
var data = S.exportAll();
var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
var a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = '我的工作台-' + S.today() + '.json';
document.body.appendChild(a);
a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
toast('已导出');
}
function pickImport() {
var f = $('#syncFile');
if (!f) return;
f.value = '';
f.click();
}
function handleImportFile(file) {
var reader = new FileReader();
reader.onload = function () {
var obj;
try { obj = JSON.parse(reader.result); } catch (e) { toast('这个文件不是 JSON', 'err'); return; }
if (!obj || !Array.isArray(obj.notes)) { toast('不像是工作台的数据包', 'err'); return; }
var n = obj.notes.length, b = (obj.books || []).length, t = (obj.timeline || []).length;
modal({
title: '从这个包还原',
body: '<p class="hint">包里：笔记 ' + n + ' 条 · 书 ' + b + ' 本 · 年表 ' + t + ' 条' +
(obj.exportedAt ? '<br>导出于 ' + esc(String(obj.exportedAt).slice(0, 19).replace('T', ' ')) : '') + '</p>' +
'<div class="field"><label>导入方式</label>' +
'<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7"><input type="radio" name="im" value="overwrite" style="width:auto;margin-top:3px">整份替换 —— 用包里的内容盖掉本机（两台机器内容才一致）</label>' +
'<label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.7"><input type="radio" name="im" value="merge" checked style="width:auto;margin-top:3px">只补缺 —— 本机已有的不动，只把缺的补上</label></div>',
foot: '<span class="l">替换不可撤销，建议先导出一份</span>' +
'<button class="btn" data-close>取消</button><button class="btn primary" data-act="sync-go">开始导入</button>',
wide: true,
onMount: function (mask) {
mask._payload = obj;
}
});
};
reader.readAsText(file, 'utf-8');
}

function askName(firstRun) {
var ov = $('#rename-overlay');
var inp = $('#rnInput');
inp.value = '';
inp.placeholder = firstRun ? '你的名字' : '新的名字';
$('#rnSeal').textContent = (S.db.meta.name || '台').slice(0, 1);
ov.classList.add('on');
setTimeout(function () { inp.focus(); }, 60);
function done(val) {

try { if (document.activeElement === inp) inp.blur(); } catch (e) { }
ov.classList.remove('on');
var name = String(val || '').trim().slice(0, 12);
S.db.meta.name = name ? name + '的工作台' : '我的工作台';
S.flag('named', true);

S.save();
renderRail();
toast('就叫「' + S.db.meta.name + '」了');
}
$('#rnOk').onclick = function () { done(inp.value); };
$('#rnCancel').onclick = function () { done(''); };
inp.onkeydown = function (e) {
if (e.key === 'Enter') done(inp.value);
if (e.key === 'Escape') done('');
};
}

var acts = {};
function act(name, fn) { acts[name] = fn; }

document.addEventListener('click', function (e) {
var el = e.target.closest('[data-act]');
if (!el) return;
var name = el.dataset.act;
var fn = acts[name];
if (!fn) return;
e.preventDefault();
fn(el, e);
});

document.addEventListener('click', function (e) {
var nav = e.target.closest('[data-view]');
if (nav) {
if (e.target.closest('#rename-overlay')) return;
openModule(nav.dataset.view);
return;
}

if (e.target.closest('#mMoreBtn')) {
if (moreOpen()) closeMore(); else openMore();
return;
}
if (e.target.closest('#mMoreMask')) { closeMore(); return; }

if (e.target.closest('#navSearch')) { closeMore(); return; }

if (e.target.closest('#brandName') || e.target.closest('.brand .seal')) askName(false);
});

document.addEventListener('keydown', function (e) {
if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
var t = e.target;
if (!t || !t.closest) return;
if (t.closest('input,textarea,select,[contenteditable]')) return;

if (e.key === 'Enter' && modalStack.length) {
var topMask = modalStack[modalStack.length - 1];
var primary = topMask.querySelector('.modal-foot .btn.primary');
var dangerModal = topMask.classList.contains('danger') ||
!!topMask.querySelector('.modal.danger');

if (primary && (primary.hasAttribute('data-danger') || dangerModal)) {
e.preventDefault();
return;
}
if (primary) {
e.preventDefault();
primary.click();
return;
}
}
var nav = t.closest('[data-view]');
if (nav) { e.preventDefault(); openModule(nav.dataset.view); return; }
if (t.closest('#mMoreBtn')) {
e.preventDefault();
if (moreOpen()) closeMore(); else openMore();
}
});

var composing = false;
document.addEventListener('compositionstart', function () { composing = true; }, true);
document.addEventListener('compositionend', function (e) {
composing = false;
var el = e.target.closest && e.target.closest('[data-input]');
if (!el) return;
var fn = acts['input:' + el.dataset.input];
if (fn) fn(el, e);
}, true);
document.addEventListener('input', function (e) {
var el = e.target.closest('[data-input]');
if (!el) return;
if (composing) return;
var fn = acts['input:' + el.dataset.input];
if (fn) fn(el, e);
});
document.addEventListener('change', function (e) {
var el = e.target.closest('[data-change]');
if (!el) return;
var fn = acts['change:' + el.dataset.change];
if (fn) fn(el, e);
});
document.addEventListener('keydown', function (e) {

var el = e.target && e.target.closest ? e.target.closest('[data-key]') : null;
if (el) {
var fn = acts['key:' + el.dataset.key];
if (fn && fn(el, e) === true) return;
}

if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey && modalStack.length) {
var topMask = modalStack[modalStack.length - 1];
var box = topMask.querySelector('.modal') || topMask;
var fs = focusables(box);
if (!fs.length) { e.preventDefault(); return; }
var cur = document.activeElement;
var idx = fs.indexOf(cur);
var fFirst = fs[0], fLast = fs[fs.length - 1];
if (idx < 0) {
e.preventDefault();
(e.shiftKey ? fLast : fFirst).focus();
return;
}
if (e.shiftKey && cur === fFirst) { e.preventDefault(); fLast.focus(); return; }
if (!e.shiftKey && cur === fLast) { e.preventDefault(); fFirst.focus(); return; }
}
if (e.key === 'Escape') {

var palOpenEl = document.querySelector('.pal-mask.on');
if (palOpenEl) return;
closeTopModal();
closeMore();
closeDuePop();
var menu = $('#themeMenu');
if (menu) menu.classList.remove('open');
}
});

act('reload-lazy', function (el) {
var url = el.dataset.url;
var ids = (g.__GZT_LAZY && g.__GZT_LAZY.maps && g.__GZT_LAZY.maps[url]) || [];
lazyState[url] = '';
if (!ids.length) return;
var pane = document.getElementById('pane-' + ids[0]);
if (pane) renderModule(ids[0], pane);
});
act('open', function (el) { openModule(el.dataset.id); });
act('set-password', function () {
var C = g.GZT_CLOUD;
if (!C || !C.openSetPassword) { toast('云端没连上，稍后再试', 'err'); return; }
C.openSetPassword();
});

act('app-update', function () {
var st = $('#updState');
var say = function (t) { if (st) st.textContent = t; };
if (typeof g.GZT_UPDATE !== 'function') {
say('这个浏览器不支持自动检查，请下拉刷新或重开页面');
return;
}
g.GZT_UPDATE(say);
});

act('app-install', function () {
var ev = deferredInstall;
if (!ev) { toast('这个浏览器没给出安装入口，用浏览器菜单里「安装 / 添加到主屏幕」', 'err'); return; }
deferredInstall = null;

try {
ev.prompt();
} catch (e) {
toast('这个浏览器不支持自动安装，请用浏览器菜单里「安装 / 添加到主屏幕」', 'err');
return;
}
toast('已弹出安装确认', 'ok');
try {
if (ev.userChoice && ev.userChoice.then) {
ev.userChoice.then(function (r) {
if (r && r.outcome === 'accepted') toast('装好了，桌面图标里能看到它', 'ok');
else toast('这次没装，浏览器里照样用', 'ok');
refresh();
}, function () { });
} else {
refresh();
}
} catch (e) { }
});
act('wish-save', function (el, e) {
var i = $('#wishIn');
S.setWish(i ? i.value : '');
var mask = e.target.closest('.mask');
if (mask) mask.close();
refresh();
});
act('sync-export', exportAll);
act('sync-import', pickImport);

act('sync-refresh', function () {
var m = S.mirror;
if (!m || typeof m.pull !== 'function' || !m.ready()) {
renderSync();
toast('只刷新了界面', 'err');
return;
}

try { m.flush(); } catch (e) {}
setTimeout(function () {
var asked = m.pull(true);
if (!asked) { renderSync(); toast('已是最新'); }
}, 400);
});
act('sync-go', function () {
var mask = modalStack[modalStack.length - 1];
var mode = (mask.querySelector('input[name="im"]:checked') || {}).value || 'merge';

if (mode === 'overwrite' && !mask._confirmed) {
var body = mask.querySelector('.modal-body');
if (body) {
var warn = document.createElement('p');
warn.className = 'hint';
warn.setAttribute('data-overwrite-warn', '');
warn.textContent = '本机将被替换：笔记 ' + (S.db.notes || []).length +
' 条 · 书 ' + (S.db.books || []).length +
' 本 · 年表 ' + (S.db.timeline || []).length + ' 条';
body.appendChild(warn);
}
var go = mask.querySelector('.modal-foot .btn.primary');
if (go) {
go.textContent = '确认覆盖本机';
go.setAttribute('data-danger', '1');
}
mask._confirmed = true;
return;
}
var res = S.importAll(mask._payload, mode);
if (!res.ok) { toast(res.error, 'err'); return; }
mask.close();
applyTheme();
renderRail();
refresh();
toast('导入完成：笔记 ' + res.counts.notes + ' · 书 ' + res.counts.books);
});

act('mbar-style', function () {
var now = mbarWantsInk();
try { localStorage.setItem('gzt.mbarNeutral', now ? '0' : '1'); } catch (e) { }
applyMbarStyle();
refresh();

toast((now ? '顶栏改回纸色（功能总览可见）' : '顶栏改成深色书脊（功能总览可见）'));
});

act('tag-open', function (el) {
var t = el.dataset.tag || '';
if (!t) return;
var open = g.App && g.App.palOpen;
if (open) open('#' + t);
});

act('mode', function (el) { setTheme({ theme: el.dataset.mode }); });
act('pick-tint', function (el) { setTheme({ tint: el.dataset.id }); });
act('theme-reset', function () { setTheme({ theme: 'auto', tint: 'xuan' }); toast('已恢复默认外观'); });

act('sort', enterSort);
act('sort-done', exitSort);
act('sort-reset', function () {
S.db.meta.cardOrder = [];
S.save();
sorting = false;
renderOverview();
renderRail();
toast('回到原序');
});

act('chq-save', saveChq);

act('chq-kind', function (el) {
var k = el.dataset.k;
if (k !== 'ledger' && k !== 'note' && k !== 'entry') return;
if (k !== qkCur) {
qkCur = k;
S.db.meta.quickKind = k;
S.save();
paintChq(k);
}
var f = k === 'ledger' ? $('#chqAmt') : $('#chqTitle');
if (f) f.focus();
});

act('todo-fold', function () {
S.db.todosCollapsed = !S.db.todosCollapsed;
S.save(); renderTodo();
});
act('todo-toggle', function (el) {
var it = S.db.todos.filter(function (t) { return t.id === el.dataset.id; })[0];
var wasDone = it && it.done;
S.toggleTodo(el.dataset.id);
renderTodo(); refreshOverviewSoft();
if (it && !wasDone) toast('做完了，大事记里多了一笔');
});
act('todo-del', function (el) {
var snap = JSON.parse(JSON.stringify(S.db.todos));
var it = S.db.todos.filter(function (x) { return x.id === el.dataset.id; })[0];
S.delTodo(el.dataset.id);
renderTodo(); refreshOverviewSoft();
offerUndo('待办删了' + (it && it.done ? '（大事记里那一笔留着）' : ''), function () {
S.db.todos = snap; S.commit();
renderTodo(); refreshOverviewSoft(); toast('放回来了');
});
});
act('todo-due', function (el) { openDuePop(el); });
act('due-set', function (el) {
S.updateTodo(duePopFor, { due: el.dataset.v });
closeDuePop(); renderTodo(); refreshOverviewSoft();
});
act('due-clear', function () {
S.updateTodo(duePopFor, { due: '' });
closeDuePop(); renderTodo(); refreshOverviewSoft();
});
act('todo-donefold', function () { tdDoneOpen = !tdDoneOpen; renderTodo(); });
act('todo-cleardone', function () {
var n = S.db.todos.filter(function (t) { return t.done; }).length;
if (!n) { toast('没有已完成的'); return; }

var removed = S.clearDoneTodos() || [];
renderTodo(); refreshOverviewSoft();
offerUndo('已清空 ' + n + ' 条已完成', function () {
S.restoreTodos(removed);
refresh(); refreshOverviewSoft(); toast('放回来了');
});
toast('已清空 ' + n + ' 条，可撤销');
});
act('todo-edit', function () {

});
document.addEventListener('dblclick', function (e) {
var el = e.target.closest('[data-act="todo-edit"]');
if (!el) return;
var it = S.db.todos.filter(function (t) { return t.id === el.dataset.id; })[0];
if (!it) return;
var input = document.createElement('input');
input.type = 'text';
input.value = it.text;
input.className = 'td-text';
input.style.cssText = 'width:100%;border:1px solid var(--border);border-radius:5px;padding:2px 5px;background:var(--panel);font-size:13px';
el.replaceWith(input);
input.focus();
input.select();
var commit = function () {
var v = input.value.trim();
if (v && v !== it.text) { S.updateTodo(it.id, { text: v }); }
renderTodo();
};
input.addEventListener('blur', commit);
input.addEventListener('keydown', function (ev) {
if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
if (ev.key === 'Escape') renderTodo();
});
});

document.addEventListener('keydown', function (e) {
var mod = e.ctrlKey || e.metaKey;
if (mod && e.key.toLowerCase() === 'w') {
if (activeId !== 'overview' && activeId !== 'sync') { e.preventDefault(); closeTab(activeId); }
} else if (mod && e.key === 'Tab') {
e.preventDefault();
var order = ['overview'].concat(Array.from(tabs.keys()));
var i = order.indexOf(activeId);
showTab(order[(i + (e.shiftKey ? -1 : 1) + order.length) % order.length]);
} else if (mod && e.key === '1') {
e.preventDefault(); showTab('overview');
}
});

function refresh() {
renderRail();
if (activeId === 'overview') renderOverview();
else if (activeId === 'sync') renderSync();
else {
var t = tabs.get(activeId);
if (t) renderModule(activeId, t.pane);
}
}

function refreshOverviewSoft() {
if (activeId !== 'overview') return;
var grid = $('#cardGrid');
if (!grid) return;
var order = S.db.meta.cardOrder.length ? S.db.meta.cardOrder : MODULES.map(function (m) { return m.id; });

grid.innerHTML = gridCardsHtml(order);

renderTodo();
if (sorting) renderSorting();
var st = S.stats();
var vals = $$('#pane-overview .stat .v');
var arr = [st.notes, st.cases, st.diary, st.docChars >= 10000 ? (st.docChars / 10000).toFixed(1) + '万' : st.docChars, st.todayChars, st.readYear];
vals.forEach(function (v, i) { if (arr[i] != null) v.textContent = arr[i]; });
}

function landingSet(mod) {
try { localStorage.setItem('gzt.landing', JSON.stringify({ mod: mod, at: Date.now() })); } catch (e) { }
}
function applyLanding() {
var raw = null;
try { raw = localStorage.getItem('gzt.landing'); } catch (e) { return; }
if (!raw) return;
try { localStorage.removeItem('gzt.landing'); } catch (e) { }
var o = {};
try { o = JSON.parse(raw) || {}; } catch (e) { return; }
if (!o.mod || Date.now() - (o.at || 0) > 20000) return;
if (!(MOD[o.mod] || o.mod === 'sync')) return;

try { openModule(o.mod); }
catch (e) { try { g.__launchErr = String((e && e.message) || e); } catch (e2) { } }
}

function consumeLaunch() {
var raw = null, goRaw = null;
try {
raw = sessionStorage.getItem('gzt.share_in');
goRaw = sessionStorage.getItem('gzt.go');
sessionStorage.removeItem('gzt.share_in');
sessionStorage.removeItem('gzt.go');
} catch (e) { return; }
if (!raw && !goRaw) return;
try { S.flag('named', true); } catch (e) { }

if (raw) {
var s = {};
try { s = JSON.parse(raw) || {}; } catch (e) { return; }
var url = String(s.url || '').trim();
var text = String(s.text || '').trim();
var title = String(s.title || '').trim();
if (/^https?:\/\//i.test(url)) {

landingSet('beach');
S.addLink({ url: url, name: title || url, note: text.slice(0, 200) });
openModule('beach');
toast('已存到沙滩');
} else if (text || title) {
landingSet('notes');
S.addNote({ content: text || title, source: title && text ? title : '分享' });
openModule('notes');
toast('已存到笔记');
}
return;
}
var go = {};
try { go = JSON.parse(goRaw) || {}; } catch (e) { return; }
if (!go.mod) return;
if (MOD[go.mod] || go.mod === 'sync') {
landingSet(go.mod);
openModule(go.mod);
if (go.isNew) {
setTimeout(function () {
var sel = go.mod === 'ledger' ? 'l-add' : (go.mod === 'notes' ? 'n-compose' : '');
if (!sel) return;
var b = document.querySelector('#pane-' + go.mod + ' [data-act="' + sel + '"]');
if (b) b.click();
}, 280);
}
}
}

var corruptNoticeShown = false;
function showCorruptNotice() {
try {
if (corruptNoticeShown) return;
if (!S || !S.corrupt || !S.corrupt()) return;
corruptNoticeShown = true;
var key = '';
try { key = (S.corruptKey && S.corruptKey()) || ''; } catch (e) { }
var bar = document.createElement('div');
bar.setAttribute('data-gzt-corrupt', '1');
bar.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top,0px));' +
'left:12px;right:12px;z-index:80;background:#f7e4e1;color:#4a2b27;' +
'border-radius:8px;padding:10px 14px;font-size:12.5px;line-height:1.7;' +
'display:flex;gap:10px;align-items:flex-start;' +
'box-shadow:0 8px 22px -12px rgba(74,43,39,.55)';
var txt = document.createElement('div');
txt.style.cssText = 'flex:1 1 auto;min-width:0';
txt.innerHTML = '这次启动时有几条读不出来，已跳过（其余内容都还在）。' +
'原始存档另存了一份，没有丢，需要时按下面这个名字去「数据同步」里找：<br>' +
'<code style="display:inline-block;word-break:break-all;background:rgba(74,43,39,.08);' +
'border-radius:4px;padding:1px 6px;font-size:11.5px">' +
esc(key || '（浏览器存储里的 gzt.corrupt.* 这一条）') + '</code>';
var btn = document.createElement('button');
btn.type = 'button';
btn.textContent = '知道了';
btn.style.cssText = 'flex:0 0 auto;border:1px solid rgba(74,43,39,.3);background:none;' +
'color:#4a2b27;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;' +
'font-family:inherit;line-height:1.4';
btn.addEventListener('click', function () {
try { if (bar.parentNode) bar.parentNode.removeChild(bar); } catch (e) { }
});
bar.appendChild(txt);
bar.appendChild(btn);
var root = document.getElementById('modalRoot');
if (root && root.parentNode) root.parentNode.insertBefore(bar, root);
else if (document.body) document.body.appendChild(bar);
} catch (e) {
}
}

function topBar(name, text, btnLabel, onClick, tail) {
try {
var bar = document.querySelector('[data-gzt-bar="' + name + '"]');
if (!bar) {
bar = document.createElement('div');
bar.setAttribute('data-gzt-bar', name);

var topPx = (g.GZT_CLOUD && g.GZT_CLOUD.on)
? 'calc(42px + env(safe-area-inset-top,0px))'
: 'calc(8px + env(safe-area-inset-top,0px))';
bar.style.cssText = 'position:fixed;top:' + topPx + ';' +
'left:12px;right:12px;z-index:70;background:#f7f3e6;color:#3f3529;' +
'border:1px solid rgba(63,53,41,.16);border-radius:8px;padding:10px 14px;' +
'font-size:12.5px;line-height:1.7;' +

'display:flex;flex-direction:column;gap:8px;' +
'box-shadow:0 8px 22px -12px rgba(63,53,41,.5)';
var root0 = document.getElementById('modalRoot');
if (root0 && root0.parentNode) root0.parentNode.insertBefore(bar, root0);
else if (document.body) document.body.appendChild(bar);
}
bar.innerHTML = '';
var txt = document.createElement('div');
txt.style.cssText = 'min-width:0';
txt.textContent = text || '';
bar.appendChild(txt);
if (btnLabel || tail) {
var row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;gap:10px;justify-content:flex-end';
if (tail) {
var t2 = document.createElement('span');
t2.style.cssText = 'flex:1 1 auto;min-width:0;font-size:11.5px;opacity:.72';
t2.textContent = tail;
row.appendChild(t2);
}
if (btnLabel) {
var btn = document.createElement('button');
btn.type = 'button';
btn.textContent = btnLabel;
btn.style.cssText = 'flex:0 0 auto;border:1px solid rgba(63,53,41,.35);background:rgba(63,53,41,.06);' +
'color:#3f3529;border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;' +
'font-family:inherit;line-height:1.4';
if (onClick) btn.addEventListener('click', function () { try { onClick(); } catch (e) { } });
row.appendChild(btn);
}
bar.appendChild(row);
}
return bar;
} catch (e) { return null; }
}
function removeBar(name) {
try {
var bar = document.querySelector('[data-gzt-bar="' + name + '"]');
if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
} catch (e) { }
}

function otherTabBar(text, btnLabel, onClick, tail) {
topBar('othertab', text, btnLabel, onClick, tail);
}
function otherTabBarHide() { removeBar('othertab'); }

var offlineShown = false;
function showOfflineBar() {
if (offlineShown) return;
offlineShown = true;
topBar('offline', '现在离线了。改动会先存在这台设备上，联网后自动补上。');
}
function hideOfflineBar() {
offlineShown = false;
removeBar('offline');
}
g.addEventListener('offline', function () { showOfflineBar(); });
g.addEventListener('online', function () {
hideOfflineBar();

try { if (g.S && g.S.mirror && g.S.mirror.push) g.S.mirror.push(); } catch (e) { }
try { toast('已恢复联网', 'ok'); } catch (e) { }
});
try {
if (g.navigator && g.navigator.onLine === false) {

if (document.body) showOfflineBar();
else document.addEventListener('DOMContentLoaded', showOfflineBar);
}
} catch (e) { }

function boot() {
S.load();
applyTheme();
applyMbarStyle();

renderRail();
S.onChange(function () {
});
if (g.matchMedia) {
var mq = g.matchMedia('(prefers-color-scheme: dark)');
var onSys = function () { if (S.db.meta.theme === 'auto') applyTheme(); };
if (mq.addEventListener) mq.addEventListener('change', onSys);
}
var hash = (location.hash || '').replace('#', '');
showTab('overview');
if (hash && (MOD[hash] || hash === 'sync')) openModule(hash);
consumeLaunch();

histInit();

showCorruptNotice();

setTimeout(applyLanding, 600);

var mbs = $('#mbarSearch'), mbt = $('#mbarTheme');
if (mbs) mbs.addEventListener('click', function () {
if (g.App && g.App.palOpen) g.App.palOpen();
});
if (mbt) mbt.addEventListener('click', function () {

if (activeId !== 'overview') showTab('overview');
setTimeout(function () {
var b = $('#themeBtn');
if (b) b.click();
}, 40);
});

if (S.mirror) S.mirror.pull();

if (!S.db.meta.name && !S.flag('named')) {
var askFirst = function () {
if (!S.db.meta.name && !S.flag('named')) askName(true);
};
if (S.mirror) S.mirror.onIdle(function () { setTimeout(askFirst, 220); });
else setTimeout(askFirst, 380);
}
document.addEventListener('click', function () {
if (!S.flag('named')) S.flag('named', true);
}, { once: true });
window.addEventListener('hashchange', function () {
var h = (location.hash || '').replace('#', '');

if (h) openModule(h, true);
});
g.addEventListener('popstate', onPop);

var vv = g.visualViewport;
if (vv && vv.addEventListener) {
var tallest = vv.height;
var onVV = function () {
if (vv.height > tallest) tallest = vv.height;
var shrunk = tallest - vv.height;
document.body.classList.toggle('kb-on', shrunk > 150);
};
vv.addEventListener('resize', onVV);
vv.addEventListener('scroll', onVV);
}
}

g.App = {

ganzhi: { year: gzYear, month: gzMonth, day: gzDay, jie: jieTime },
MODULES: MODULES, MOD: MOD,
esc: esc, $: $, $$: $$, pad: pad, fmtTime: fmtTime, dayLabel: dayLabel,
money: money, stars: stars, season: season, spine: spine, toast: toast, offerUndo: offerUndo, modal: modal,
closeTopModal: closeTopModal, modalStack: modalStack,
otherTabBar: otherTabBar, otherTabBarHide: otherTabBarHide,
view: view, Views: Views, refresh: refresh, refreshOverviewSoft: refreshOverviewSoft,
openModule: openModule, showTab: showTab, closeTab: closeTab, tabs: tabs,
openRaw: openRaw,
act: act, acts: acts, renderRail: renderRail, applyTheme: applyTheme, setTheme: setTheme,
boot: boot, askName: askName, get activeId() { return activeId; },
renderTodo: renderTodo,
docProgress: docProgress
};
})(window);
