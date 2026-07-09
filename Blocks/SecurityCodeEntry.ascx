<%@ Control Language="C#" AutoEventWireup="true"
    CodeFile="SecurityCodeEntry.ascx.cs"
    Inherits="com.gracefellowship.Arrivals.Blocks.SecurityCodeEntry" %>

<%@ Register Namespace="Rock.Web.UI.Controls" Assembly="Rock" TagPrefix="Rock" %>

<asp:UpdatePanel ID="upKiosk" runat="server" UpdateMode="Conditional">
    <ContentTemplate>

        <!-- ─── No active session: tell the volunteer an admin needs to launch first ─── -->
        <asp:Panel ID="pnlNoSession" runat="server" Visible="false" CssClass="row">
            <div class="col-md-6 col-md-offset-3">
                <div class="panel panel-block">
                    <div class="panel-heading">
                        <h1 class="panel-title"><i class="fa fa-exclamation-circle"></i>&nbsp;No Active Billboard</h1>
                    </div>
                    <div class="panel-body text-center">
                        <p style="font-size: 1.4em;">
                            An admin needs to start a billboard session first.
                        </p>
                        <p class="text-muted">
                            Please ask a staff member to launch today's session from the Arrivals Admin page.
                        </p>
                    </div>
                </div>
            </div>
        </asp:Panel>

        <!-- ─── Active kiosk: security-code entry form ─── -->
        <asp:Panel ID="pnlKiosk" runat="server" Visible="false" CssClass="row">
            <div class="col-md-6 col-md-offset-3">

                <div class="panel panel-block">
                    <div class="panel-heading">
                        <h1 class="panel-title">
                            <i class="fa fa-qrcode"></i>&nbsp;<asp:Literal ID="litSessionHeader" runat="server" />
                        </h1>
                    </div>
                    <div class="panel-body">

                        <Rock:NotificationBox ID="nbResult" runat="server" Visible="false" />

                        <div class="form-group" style="margin-top: 20px;">
                            <label class="control-label" style="font-size: 1.2em;" for="<%= tbSecurityCode.ClientID %>">
                                Enter the parent's security code
                            </label>
                            <asp:TextBox ID="tbSecurityCode" runat="server"
                                CssClass="form-control input-lg"
                                Style="font-size: 2em; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; height: 70px;"
                                Placeholder="e.g. A3B"
                                autocomplete="off"
                                autofocus="autofocus"
                                MaxLength="20" />
                        </div>

                        <asp:Button ID="btnSubmit" runat="server"
                            Text="Add to Billboard"
                            CssClass="btn btn-primary btn-lg btn-block"
                            Style="font-size: 1.4em; padding: 16px;"
                            OnClick="btnSubmit_Click" />

                        <div class="margin-t-lg" style="text-align: center;">
                            <p class="text-muted">
                                <asp:Literal ID="litSessionFooter" runat="server" />
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </asp:Panel>

    </ContentTemplate>
</asp:UpdatePanel>

<!-- Auto-focus the code field after each async postback (the UpdatePanel clears focus) -->
<script>
    Sys.WebForms.PageRequestManager.getInstance().add_endRequest(function () {
        var field = document.getElementById('<%= tbSecurityCode.ClientID %>');
        if (field) { field.focus(); field.select(); }
    });
</script>
