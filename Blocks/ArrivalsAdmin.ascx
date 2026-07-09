<%@ Control Language="C#" AutoEventWireup="true"
    CodeFile="ArrivalsAdmin.ascx.cs"
    Inherits="com.gracefellowship.Arrivals.Blocks.ArrivalsAdmin" %>

<%@ Register Namespace="Rock.Web.UI.Controls" Assembly="Rock" TagPrefix="Rock" %>

<asp:UpdatePanel ID="upMain" runat="server" UpdateMode="Conditional">
    <ContentTemplate>
        <div class="panel panel-block">
            <div class="panel-heading">
                <h1 class="panel-title">
                    <i class="fa fa-child"></i>&nbsp;Grace Arrivals &mdash; Admin
                </h1>
            </div>
            <div class="panel-body">
                <Rock:NotificationBox ID="nbInfo" runat="server" NotificationBoxType="Info" Visible="true">
                    Plugin skeleton installed. The admin configuration UI (date / check-in area selection,
                    launch &amp; clear the active billboard session, color &amp; icon assignment) arrives in Phase 2.
                </Rock:NotificationBox>
            </div>
        </div>
    </ContentTemplate>
</asp:UpdatePanel>
