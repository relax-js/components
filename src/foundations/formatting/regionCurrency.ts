// The currency in use in each region, from the Unicode CLDR currency data (version 45), as
// "CUR AA BB" rows: the currency code, then the ISO 3166 regions that use it. A region with more
// than one legal tender, such as Panama, is left out, so it has no single currency.
const table =
    'AED AE,AFN AF,ALL AL,AMD AM,AOA AO,ARS AR,AUD AU CC CX HM KI NF NR TV,AWG AW,AZN AZ,BAM BA,' +
    'BBD BB,BDT BD,BGN BG,BHD BH,BIF BI,BMD BM,BND BN,BOB BO,BRL BR,BSD BS,BWP BW,BYN BY,BZD BZ,' +
    'CAD CA,CDF CD,CHF CH LI,CLP CL,CNY CN,COP CO,CRC CR,CUP CU,CVE CV,CZK CZ,DJF DJ,DKK DK FO GL,' +
    'DOP DO,DZD DZ,EGP EG,ERN ER,ETB ET,' +
    'EUR AD AT AX BE BL CY DE EA EE ES EU FI FR GF GP GR HR IC IE IT LT LU LV MC ME MF MQ MT NL PM PT RE SI SK SM TF VA XK YT,' +
    'FJD FJ,FKP FK,GBP GB GG GS IM JE TA,GEL GE,GHS GH,GIP GI,GMD GM,GNF GN,GTQ GT,GYD GY,HKD HK,' +
    'HNL HN,HUF HU,IDR ID,ILS IL,INR IN,IQD IQ,IRR IR,ISK IS,JMD JM,JOD JO,JPY JP,KES KE,KGS KG,' +
    'KHR KH,KMF KM,KPW KP,KRW KR,KWD KW,KYD KY,KZT KZ,LAK LA,LBP LB,LKR LK,LRD LR,LYD LY,MAD EH MA,' +
    'MDL MD,MGA MG,MKD MK,MMK MM,MNT MN,MOP MO,MRU MR,MUR MU,MVR MV,MWK MW,MXN MX,MYR MY,MZN MZ,' +
    'NGN NG,NIO NI,NOK BV NO SJ,NPR NP,NZD CK NU NZ PN TK,OMR OM,PEN PE,PGK PG,PHP PH,PKR PK,PLN PL,' +
    'PYG PY,QAR QA,RON RO,RSD RS,RUB RU,RWF RW,SAR SA,SBD SB,SCR SC,SDG SD,SEK SE,SGD SG,SHP AC SH,' +
    'SLE SL,SOS SO,SRD SR,SSP SS,STN ST,SYP SY,SZL SZ,THB TH,TJS TJ,TMT TM,TND TN,TOP TO,TRY TR,' +
    'TTD TT,TWD TW,TZS TZ,UAH UA,UGX UG,' +
    'USD AS BQ DG EC FM GU IO MH MP PR PW SV TC TL UM US VG VI ZW,UYU UY,UZS UZ,VES VE,VND VN,' +
    'VUV VU,WST WS,XAF CF CG CM GA GQ TD,XCD AG AI DM GD KN LC MS VC,XCG CW SX,' +
    'XOF BF BJ CI GW ML NE SN TG,XPF NC PF WF,YER YE,ZAR ZA,ZMW ZM';

const currencyOfRegion = new Map<string, string>(
    table.split(',').flatMap((row) => {
        const [currency, ...regions] = row.split(' ');
        return regions.map((region): [string, string] => [region, currency]);
    })
);

/**
 * The currency of the locale's region, such as `SEK` for `sv-SE` and for `sv`, whose likeliest
 * region is Sweden. Undefined when the region has no single currency, such as `419` (Latin America).
 */
export function regionCurrency(locale: string): string | undefined {
    let region: string | undefined;
    try {
        region = new Intl.Locale(locale).maximize().region;
    } catch {
        return undefined;
    }
    return region === undefined ? undefined : currencyOfRegion.get(region);
}
