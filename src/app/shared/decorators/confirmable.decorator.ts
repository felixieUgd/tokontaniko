import Swal, {SweetAlertOptions} from 'sweetalert2';

export function Confirmable(options?: SweetAlertOptions, withPropagation?: boolean) {

  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const config: SweetAlertOptions = {
      title: 'En attente de confirmation',
      html: 'Êtes-vous sûr de vouloir effectuer cette action?',
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non'
    };

    if (options){
      Object.keys(options).forEach( x => config[x] = options[x]);
    }
    
    descriptor.value = async function (...args) {
      const res = await Swal(config);
      if (withPropagation) {
        args.push(res.value);
      }

      if (res.value || withPropagation) {
        const result = originalMethod.apply(this, args);
        return result;
      }
    };
    return descriptor;

  };

}