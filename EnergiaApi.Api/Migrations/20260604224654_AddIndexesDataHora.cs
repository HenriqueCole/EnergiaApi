using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EnergiaApi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexesDataHora : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Leituras_DataHora",
                table: "Leituras",
                column: "DataHora");

            migrationBuilder.CreateIndex(
                name: "IX_Alertas_DataHora",
                table: "Alertas",
                column: "DataHora");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leituras_DataHora",
                table: "Leituras");

            migrationBuilder.DropIndex(
                name: "IX_Alertas_DataHora",
                table: "Alertas");
        }
    }
}
