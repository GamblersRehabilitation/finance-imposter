import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {WheelHelpVideo,WHEEL_HELP_VIDEO} from '../src/WheelHelpVideo';
import {RoleVideo,roleVideoSource} from '../src/RoleFilm';
import {GambleGame} from '../src/GambleWheel';
it('biedt de stille gokradfilm met zoeken, één sluitknop en een aparte veilige oefening',()=>{const html=renderToStaticMarkup(createElement(WheelHelpVideo,{disabled:false,onClose:()=>{},onPractice:()=>{}}));expect(html).toContain(WHEEL_HELP_VIDEO);expect(html).toContain('/tutorials/gokrad-poster.png');expect(html).toContain('muted');expect(html).toContain('Positie in uitlegvideo');expect(html.match(/Gokrad-uitleg sluiten/g)).toHaveLength(1);expect(html).toContain('Zelf oefenen zonder echte inzet');expect(html).not.toContain('Eigen rolvideo dempen');expect(html).not.toContain('Geluid van eigen rolvideo inschakelen');});
it('houdt de aangeleverde rolfilm en eigen dempbediening los van de gokradfilm',()=>{const html=renderToStaticMarkup(createElement(RoleVideo,{role:'gambler'}));expect(html).toContain(roleVideoSource('gambler'));expect(html).toContain('Geluid van eigen rolvideo inschakelen');expect(html).not.toContain(WHEEL_HELP_VIDEO);});
it('laadt de uitlegfilm pas na openen van hulp en doet vooraf geen spelactie',()=>{const action=vi.fn(async()=>({})),html=renderToStaticMarkup(createElement(GambleGame,{s:{gambler:{balance:5000,wealth:5000,spendable:5000,maxStake:8400,spinsRemaining:2,goal:280000},phase:'playing',meeting:{phase:'idle'}},action,disabled:false}));expect(html).toContain('Stille uitleg van het gokrad');expect(html).not.toContain(WHEEL_HELP_VIDEO);expect(html).not.toContain('<dialog');expect(action).not.toHaveBeenCalled();});
