/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {animate, animateChild, query, style, transition, trigger, ɵAnimationGroupPlayer as AnimationGroupPlayer} from '@angular/animations';
import {AnimationDriver, ɵAnimationEngine} from '@angular/animations/browser';
import {MockAnimationDriver, MockAnimationPlayer} from '@angular/animations/browser/testing';
import {Component, HostBinding} from '@angular/core';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router, RouterOutlet} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

export function main() {
  describe('Animation Router Tests', function() {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, BrowserAnimationsModule],
        providers: [{provide: AnimationDriver, useClass: MockAnimationDriver}]
      });
    });

    it('should query the old and new routes via :leave and :enter', fakeAsync(() => {
         @Component({
           animations: [
             trigger(
                 'routerAnimations',
                 [
                   transition(
                       'page1 => page2',
                       [
                         query(':leave', animateChild()),
                         query(':enter', animateChild()),
                       ]),
                 ]),
           ],
           template: `
              <div [@routerAnimations]="prepareRouteAnimation(r)">
                <router-outlet #r="outlet"></router-outlet>
              </div>
            `
         })
         class ContainerCmp {
           constructor(public router: Router) {}

           prepareRouteAnimation(r: RouterOutlet) {
             const animation = r.activeRouteData['animation'];
             const value = animation ? animation['value'] : null;
             return value;
           }
         }

         @Component({
           selector: 'page1',
           template: `page1`,
           animations: [
             trigger(
                 'page1Animation',
                 [
                   transition(
                       ':leave',
                       [
                         style({width: '200px'}),
                         animate(1000, style({width: '0px'})),
                       ]),
                 ]),
           ]
         })
         class Page1Cmp {
           @HostBinding('@page1Animation') public doAnimate = true;
         }

         @Component({
           selector: 'page2',
           template: `page2`,
           animations: [
             trigger(
                 'page2Animation',
                 [
                   transition(
                       ':enter',
                       [
                         style({opacity: 0}),
                         animate(1000, style({opacity: 1})),
                       ]),
                 ]),
           ]
         })
         class Page2Cmp {
           @HostBinding('@page2Animation') public doAnimate = true;
         }

         TestBed.configureTestingModule({
           declarations: [Page1Cmp, Page2Cmp, ContainerCmp],
           imports: [RouterTestingModule.withRoutes([
             {path: 'page1', component: Page1Cmp, data: makeAnimationData('page1')},
             {path: 'page2', component: Page2Cmp, data: makeAnimationData('page2')}
           ])]
         });

         const engine = TestBed.get(ɵAnimationEngine);
         const fixture = TestBed.createComponent(ContainerCmp);
         const cmp = fixture.componentInstance;
         cmp.router.initialNavigation();
         tick();
         fixture.detectChanges();
         engine.flush();

         cmp.router.navigateByUrl('/page1');
         tick();
         fixture.detectChanges();
         engine.flush();

         cmp.router.navigateByUrl('/page2');
         tick();
         fixture.detectChanges();
         engine.flush();

         const player = engine.players[0] !;
         const groupPlayer = player.getRealPlayer() as AnimationGroupPlayer;
         const players = groupPlayer.players as MockAnimationPlayer[];
         expect(players.length).toEqual(4);

         const [p1, p1cover, p2, p2cover] = players;
         expect(p1.keyframes).toEqual([
           {offset: 0, width: '200px'},
           {offset: 1, width: '0px'},
         ]);

         expect(p2.keyframes).toEqual([
           {offset: 0, opacity: '0'},
           {offset: .5, opacity: '0'},
           {offset: 1, opacity: '1'},
         ]);
       }));
  });
}

function makeAnimationData(value: string, locals: {[key: string]: any} = {}): {[key: string]: any} {
  locals['value'] = value;
  return {'animation': locals};
}
