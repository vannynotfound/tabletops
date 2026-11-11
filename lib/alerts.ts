import Swal, { type SweetAlertIcon } from "sweetalert2";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  customClass: { popup: "tabletop-toast" },
});

export function showToast(icon: SweetAlertIcon, title: string) {
  return toast.fire({ icon, title });
}

export function showAlert(icon: SweetAlertIcon, title: string, text: string) {
  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonText: "Okay",
    buttonsStyling: false,
    customClass: {
      popup: "tabletop-alert",
      title: "tabletop-alert-title",
      htmlContainer: "tabletop-alert-text",
      confirmButton: "tabletop-alert-confirm",
    },
  });
}
