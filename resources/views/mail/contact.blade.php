<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <!--$-->
  </head>
  <body
    style='background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
  >
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="max-width:37.5em;margin:0 auto;padding:20px 0 48px"
    >
      <tbody>
        <tr style="width:100%">
          <td>
            <p>Nom et Prenom: </p>
            <p style="font-size:16px;line-height:26px;margin:16px 0">
              <!-- -->{{$contact["name"]}}<!-- -->
            </p>
            <p>Email:</p>
            <p style="font-size:16px;line-height:26px;margin:16px 0">
             {{ $contact["email"] }}
            </p>
            <p>Objet :</p>
            <p style="font-size:16px;line-height:26px;margin:16px 0">{{ $contact["subject"] }}</p>
            <p>Message :</p>
            <p style="font-size:16px;line-height:26px;margin:16px 0">
             {!! nl2br(e($contact["message"])) !!}
            </p>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
