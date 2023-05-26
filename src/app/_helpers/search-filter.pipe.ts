import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'searchFilter',
    pure: false
})
export class SearchFilterPipe implements PipeTransform {
    transform(items: any[], term:string, filterBy:string[], options?:{ childField?:string, ignore?:boolean }): any {
        if (!items || !term || !filterBy || (options && options.ignore)) { //ignore is used when filtering parent only
            return items;
        }

        term = term.toLowerCase() ;
        return items.filter(item => {
            let exist = false;
            let tmp = item;
            if(options && options.childField){
                tmp = item[options.childField];
            }
            filterBy.every(filter => {
                exist = (tmp[filter] && tmp[filter].toLowerCase().indexOf(term) !== -1);
                return !exist;
            });
            return exist;
        }
        );
    }
}